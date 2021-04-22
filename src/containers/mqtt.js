import React, {Component} from 'react';
import { connect } from 'react-redux';
import Mqtt from 'mqtt';
//import Cbor from 'cbor';
import PropTypes from 'prop-types';

import { sendAction, updateWhiteboard, updateClientID, MQTT_CONNECTED, MQTT_DISCONNECTED, MQTT_RECONNECTING } from '../actions';
import '../styles/mqtt.scss';

//import RtCbor from "../scripts/RtCbor";
const RtCbor = require('../scripts/RtCbor');

import cbor from 'cbor';
//import { sendMsg } from '../scripts/functions';

export let cellID, //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)
  mqttClient;

let numMsgs = 0,
  localClientID; //localClientID used instead of this.props.clientID because localClientID is scoped in componentDidMount, so it won't be updated on next render. Therefore, must make an updating value OUTSIDE of props

let rtCbor = new RtCbor();

class MQTT extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    updateWhiteboard: PropTypes.func.isRequired,
    updateClientID: PropTypes.func.isRequired,
    sendAction: PropTypes.func.isRequired,
    mqttConnection: PropTypes.string.isRequired,
    localClientID: PropTypes.string
  }

  componentDidUpdate() {
    localClientID = this.props.clientID;
  }

  componentDidMount() {
    localClientID = this.props.clientID;
    const mqttHost = 'wss://mqtt.roos.com'; // dev broker'
    //const mqttHost = 'ws://localhost'; //localhost
    const port = '8883'; // local mqtt wss port '8081', server ws '8883'
    const { sendAction, updateWhiteboard, updateClientID } = this.props;
    const mqttBroker = mqttHost + ':' + port + "/mqtt";  // secure websocket port (wss) (init by rTalkDistribution/moquette/bin/moquette.sh)
                                                         // NOTE: some brokers (aka mosquitto) requires "/mqtt" URL path to function
    const mqttConnectOptions = {
      clientId: localClientID + Math.random().toString(16).substr(2,8), //MQTT ID is "ws" plus localClientID
      keepalive: 0,
      protocolID: 'MQTT',
      protocolVersion: 4,
      clean: true,
      username: "rtalk",
      password: "rtalkrtalkrtalk",
      properties: {
        recieveMaximum: 100
      }
      //rejectUnauthorized: false	//false for self-signed certificates, true in production
    };
    mqttClient = Mqtt.connect(mqttBroker, mqttConnectOptions);
   //mqttClient2 = Mqtt.connect(mqttBroker, mqttConnectOptions);

    console.info('Client ID: ' + localClientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

    const adminTopic = 'admin/admin/cellinfo/query/#';  //listen to discover cellID

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
        //var decodedCborMsgs1 = cbor.decodeAllSync(message); //DEBUG
        var decodedCborMsgs = rtCbor.decodeAll(message);
        //console.info('CBOR1:', decodedCborMsgs1);  //DEBUG

        //check if not empty message
        if(decodedCborMsgs && decodedCborMsgs.length > 0 && decodedCborMsgs[0].length > 0) 
          console.info('Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' +  'Decoded Message: ', decodedCborMsgs);
        else {
          console.info('Message ' + numMsgs + ' (empty) Received - \n Topic: ' + topic.toString() + '\n ' + 'Decoded Message: ', decodedCborMsgs);
          return;
        }
      } 
      catch(err) {
        console.info('ERROR Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' + 'Message: ', message.toString()+ 'ERROR=['+err+']');
        return;
      }

      if (topic.includes('admin/') && !cellID) {
        //REGISTERING CELLID
        if ( decodedCborMsgs[0][1] == "cellId") {
          //multiple admin messages could be received
          cellID = decodedCborMsgs[0][2];
          console.info('CellID: ', cellID);

          //UNSUBSCRIBE
          console.info('Unsubscribing from: ' + adminTopic);
          mqttClient.unsubscribe(adminTopic);

          //SUBSCRIBE
          let channelID = '+';
          const domainTopic = '+/' + cellID + '/#';
          const wbCreateSubTopic = '+/' + cellID + '/whiteboard/createSubscriber/1'; //get app ID
         //unused const consoleSubTopic = '+/' + cellID + '/console/#'; //console guru button bar, launch apps, launcher

          let GURUBROWSER_App_Topics = [
            domainTopic,
            wbCreateSubTopic,
            channelID + '/'+ cellID + '/' + localClientID + '/+/subscribe/#',
            channelID + '/' + cellID + '/'+ localClientID +'/#'
          ];
          console.info('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
          mqttClient.subscribe(GURUBROWSER_App_Topics, {qos: 2});

          //let a =[null,'view','console','logger','true']; //testing msg as array
          //smCbor.putMap(null, a);
          //let msgOmap = { null:{'view':'console','logger':'true'}};  //testing msg as omap
          //rtCbor.encodeOMap(msgOmap);

          let msgArray = [null, 'view','console','logger','true']
          rtCbor.encodeArray(msgArray);

          //sanity check encoding
          console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) )
          //rtCbor.encodeOMap(msgOmap);  //need to re-encode since .getCborAsBuffer() also clears it)
          rtCbor.encodeArray(msgArray);

          //let consoleCreateSub = [null,'view=console','logger=true'] // ^+view=Console+logger=true  was //Buffer.from('9fd3f6647669657767436f6e736f6c65ff', 'hex');
          //let consoleCreateSub = rtCbor.getCborAsBuffer
          //let consoleCreateSubTopic = 'console/' + cellID + '/whiteboard/createSubscriber/' + numMsgs;
          //mqttClient.publish(consoleCreateSubTopic, consoleCreateSub);

          let selectGuruApp = Buffer.from('9fd3656576656e7466776964676574676170704d656e75676368616e6e656c6854304a39393930376973656c656374696f6e6c0141412b6752756e204170706d73656c656374696f6e6170707369014167414967757275ff', 'hex'); //publishing this launches guru app
          let guruAppTopic = localClientID + '/' + cellID + '/console/subscribe/' + numMsgs;
          mqttClient.publish(guruAppTopic, selectGuruApp); //launches guru app
          console.info('PUB Message ' + numMsgs + ' - \n Topic: ' + guruAppTopic.toString() + '\n ' + 'Decoded CBOR Message: ', cbor.decodeAllSync(selectGuruApp));
				}
      }

      else if (topic.includes(cellID + '/' + localClientID) && !topic.includes('console')) { //if message for us, but ignoring console instructions
        let model = topic.split('/')[0];  //isolate each app by topic
        updateWhiteboard(decodedCborMsgs, model); //update store with decoded cbor
      }

      //ENABLE FOR DEBUGGING
      else if (decodedCborMsgs[0][0].value === 'toppane') { //if msg not going to our localClientID, but is still an app (ex. debugging tool)
        let model = topic.split('/')[0];
        updateWhiteboard(decodedCborMsgs, model);
      }

      else if (topic.includes(cellID + '/GURUBROWSER/subscribe')) { //update to newly received localClientID
          let newClientID = topic.split('/')[0];
          updateClientID(newClientID);
      }

      else if (message.toString()=='end') {
       mqttClient.unsubscribe('+/+/' + localClientID + '/#');
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
    return (
      <div styleName='ri-mqtt'>
        <div className="pull-left">Client ID: {localClientID}</div>
        <div className="pull-right">
          Connection
          <div styleName={`connectionIcon ${this.props.mqttConnection}`} />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
    whiteboard: state.whiteboard,
    mqttConnection: state.mqttConnection
  };
}

export default connect(mapStateToProps, {sendAction, updateWhiteboard,  updateClientID })(MQTT);
