import {Component} from 'react';
import { connect } from 'react-redux';
import {sendAction, updateWhiteboard, updateClientID, MQTT_CONNECTED, MQTT_DISCONNECTED, MQTT_RECONNECTING } from '../actions';
import PropTypes from 'prop-types';

const mqtt = require('mqtt');
const cbor = require('cbor');

export let cellID, //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)
  mqttClient;

let numMsgs = 0;

class MQTT extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    updateWhiteboard: PropTypes.func.isRequired,
    updateClientID: PropTypes.func.isRequired,
    sendAction: PropTypes.func.isRequired
  }

  componentDidMount() {
    const mqttHost = 'ws://localhost';
    const port = '8081';
    const { sendAction, updateWhiteboard, updateClientID, clientID } = this.props;
    const mqttBroker = mqttHost + ':' + port + '/mqtt';  // websocket port (ws) (init by rTalkDistribution/moquette/bin/moquette.sh)
    const mqttConnectOptions = {
      clientId: "mqtt_" + clientID //MQTT ID is "mqtt-" plus clientID
      //rejectUnauthorized: false	//false for self-signed certificates, true in production
    };
    mqttClient = mqtt.connect(mqttBroker, mqttConnectOptions);

    console.info('Client ID: '+ clientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

    const adminTopic = 'admin/+/cellinfo/info/#';  //only used to discover cellID

  //-------------------------------------
  //-----MQTTCLIENT.ON LISTENING OPTIONS-----
  //-------------------------------------
    // MQTT Connect sequence - adminTopic - appTopic
    mqttClient.on('connect', function () {
      sendAction(MQTT_CONNECTED);
      console.info('Subscribing to admin topic: '+ adminTopic);
      mqttClient.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive message with cellID then UNSUBSCRIBE
    });

    mqttClient.on('reconnect', function () {
      sendAction(MQTT_RECONNECTING);
    });

    //Main MQTT Parsing loop
    mqttClient.on('message', function (topic, message) {
      numMsgs++;
      try {
        var decodedCborMsg = cbor.decodeAllSync(message); //var, not let
        //check if not empty message
        if (decodedCborMsg.length > 0 && decodedCborMsg[0].length > 0) console.info('Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' + 'CBOR Decoded Message: ', decodedCborMsg);
        else {
          console.info('Message ' + numMsgs + ' (empty) Received - \n Topic: ' + topic.toString() + '\n ' + 'CBOR Decoded Message: ', decodedCborMsg);
          return;
        }
      } catch(err) {
        console.info('Message' + numMsgs + 'Received - \n Topic: ' + topic.toString() + '\n ' + 'Message: ', message.toString());
        return;
      }

      if (topic.includes("admin/") && !cellID) {
        //REGISTERING CELLID
        if ( decodedCborMsg[0][1] == "cellId") {
          //multiple admin messages could be received
          cellID = decodedCborMsg[0][2];
          console.info('CellID: ', cellID);

          //UNSUBSCRIBE
          console.info('Unsubscribing from: ' + adminTopic);
          mqttClient.unsubscribe(adminTopic);

          //SUBSCRIBE
          let channelID = '+';
          const domainTopic = '+/' + cellID + '/#';
          const wbCreateSubTopic = '+/' + cellID + '/whiteboard/createSubscriber/1'; //get app ID
          let GURUBROWSER_App_Topics = [
            domainTopic,
            wbCreateSubTopic,
            channelID + '/'+ cellID + '/' + clientID + '/+/subscribe/1',
            channelID + '/' + cellID + '/'+ clientID +'/action/1'
          ];
          console.info('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
          mqttClient.subscribe(GURUBROWSER_App_Topics, {qos: 2});

          let consoleCreateSub = Buffer.from('9fd3f6647669657767436f6e736f6c65ff', 'hex');
          let consoleCreateSubTopic = 'console/X1PD0ZR3/whiteboard/createSubscriber/8';

          let selectGuruApp = Buffer.from('9fd3656576656e7466776964676574676170704d656e75676368616e6e656c6854304a39393930376973656c656374696f6e6c0141412b6752756e204170706d73656c656374696f6e6170707369014167414967757275ff', 'hex'); //publishing this launches guru app
          let guruAppTopic = clientID + '/X1PD0ZR3/console/action/1';
          mqttClient.publish(consoleCreateSubTopic, consoleCreateSub);
          mqttClient.publish(guruAppTopic, selectGuruApp); //launches guru app
				}
      }

      else if (topic.includes(cellID + '/' + clientID) && !topic.includes('console')) { //if message for us, but ignoring console instructions
        let model = topic.split('/')[0];
        updateWhiteboard(decodedCborMsg, model);
      }

      //ENABLE FOR DEBUGGING
      else if (decodedCborMsg[0][0].value === 'toppane') { //if msg not going to our clientID, but is still an app (ex. debugging tool)
        let model = topic.split('/')[0];
        updateWhiteboard(decodedCborMsg, model);
      }

      else if (topic.includes(cellID + '/GURUBROWSER/subscribe')) { //update to newly received clientID
          let newClientID = topic.split('/')[0];
          updateClientID(newClientID);
      }

      else if (message.toString()=='end') {
       mqttClient.unsubscribe('+/+/' + clientID + '/#');
       mqttClient.end();
      }
    });

    mqttClient.on('error', function(err) {
      console.error("Error: " + err.toString());
    });

    mqttClient.on('close', function () {
      console.info("Connection closed");
      sendAction(MQTT_DISCONNECTED);
      cellID = null;
    });
  }

  render() {
    return null; //Don't yet want to show anything for MQTT, possibly in future updates.
  }
}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
    whiteboard: state.whiteboard
  };
}

export default connect(mapStateToProps, {sendAction, updateWhiteboard,  updateClientID })(MQTT);
