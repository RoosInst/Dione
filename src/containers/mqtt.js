import React, {Component} from 'react';
import { connect } from 'react-redux';
import Mqtt from 'mqtt';
//import Cbor from 'cbor';
import PropTypes from 'prop-types'; //used to include { node } 

import { sendAction, updateWhiteboard, updateClientID, updateMqttSubscriptions, MQTT_CONNECTED, MQTT_DISCONNECTED, MQTT_RECONNECTING } from '../actions';
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

let currentWidget;
let incompleteWidgetTopic;
let widgetTopic;
let propChannel;
class MQTT extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    updateWhiteboard: PropTypes.func.isRequired,
    updateClientID: PropTypes.func.isRequired,
    sendAction: PropTypes.func.isRequired,
    mqttConnection: PropTypes.string.isRequired,
    localClientID: PropTypes.string,
    subscriptions: PropTypes.object.isRequired
  }

  componentDidUpdate() {
    localClientID = this.props.clientID;
  }

  componentDidMount() {
    localClientID = this.props.clientID;
    const subscriptions = this.props.subscriptions;

    const mqttHost = 'wss://mqtt.roos.com'; // dev broker'
    //const mqttHost = 'ws://localhost'; //localhost
    const port = '8883'; // local mqtt wss port '8081', server ws '8883'
    const { sendAction, updateWhiteboard, updateClientID, updateMqttSubscriptions } = this.props;
    const mqttBroker = mqttHost + ':' + port + "/mqtt";  // secure websocket port (wss) (init by rTalkDistribution/moquette/bin/moquette.sh)
                                                         // MQTT 3.1+ brokers require a websockets path +"/mqtt"
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
    updateMqttSubscriptions("client", mqttClient);
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

    //X016OK8G:msgTool/X016OK8G/+/actions
    //Main MQTT Parsing loop
    mqttClient.on('message', function (topic, message) {
      numMsgs++;
      try {
        //var decodedCborMsgs1 = cbor.decodeAllSync(message); //DEBUG
        var decodedCborMsgs = rtCbor.decodeAll(message);
        //console.info('CBOR1:', decodedCborMsgs1);  //DEBUG

        //TODO:confirm srcReplyAddress is needed for return messages
        //let srcReplyAddress = topic.split('/')[0]  // first topic split is the Return Adress "RA"
        
        //check to see if the message pertains to a widget that is trying to render
        if(topic.toString().includes("admin/nodeAdmin")) {
          let channel = decodedCborMsgs[0][4];
          let nodeName = decodedCborMsgs[0][6];
          if(topic.toString().includes("disconnect")) {
            updateMqttSubscriptions(nodeName, channel);
          } else if(topic.toString().includes("connect")) {
            if(nodeName == 'propsEdit') {
              propChannel = channel;
            }
            if(subscriptions.widget_messages != undefined) {
                if(nodeName != "WB") {
                  incompleteWidgetTopic = `${subscriptions.cellId}:${channel}/${subscriptions.cellId}/`;
                  currentWidget = nodeName;
                  updateMqttSubscriptions(nodeName, `${subscriptions.cellId}:${channel}/${subscriptions.cellId}/+/action/#`);
                } else {
                  widgetTopic = incompleteWidgetTopic + channel;
                }
            } 
          } 
        } else if(topic.toString().includes(widgetTopic)) {
          updateMqttSubscriptions(currentWidget, widgetTopic); //unsubscribe from general topic for the application being rendered
          updateMqttSubscriptions(currentWidget, widgetTopic + '/#');  //resubscribe to specific topic with the app's channel
        }
        
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

      //INITILIZATION STAGE
      //Register the CellID from the Broker (Rtalk Server)
      if (topic.includes('admin/') && !cellID) {
        //REGISTERING CELLID
        if ( decodedCborMsgs[0][1] == "cellId") {
          //multiple admin messages could be received
          cellID = decodedCborMsgs[0][2];
          console.info('CellID: ', cellID);
          updateMqttSubscriptions("cellId", cellID);
          //UNSUBSCRIBE
          console.info('Unsubscribing from: ' + adminTopic);
          mqttClient.unsubscribe(adminTopic);

          //SUBSCRIBE
          //let channelID = '+'; //+ is wildcard for debug, TODO: should be localClientID or the Return Address of THIS whiteboard
          //const domainTopic = '+/' + cellID + '/#';  //debug only - remove for production
          //const wbCreateSubTopic = '+/' + cellID + '/whiteboard/createSubscriber/1'; //get app ID
         //unused const consoleSubTopic = '+/' + cellID + '/console/#'; //console guru button bar, launch apps, launcher
          
         // removed domainTopic,
         //got rid of local client id in first entry of array
         //channelID + '/' + cellID + '/'+ '#', 
         //channelID + '/' + cellID + '/+/nodeAdmin/#' OLD CHANNELS
         //starts listening to all channels when first launched, can be changed through checkboxes 
          let GURUBROWSER_App_Topics = [
            "+/#"
          ];
          /***
           * Topics = ReturnAddress/domain/channel/api/msgID
           * ReturnAddress = MQTT client identifier - localClientID
           * domain = broker identifier - cellID
           * channel = systemID (locally unique ID) (since Dione renders all apps, +)
           * api = determines the body structure
           * msgID = string - reply should match the msgID in the request, typically incrementing integer
           */

          console.info('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
          mqttClient.subscribe(GURUBROWSER_App_Topics, {qos: 1});

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
      
      // rtalk PING
      else if (topic.includes('/nodeAdmin') && decodedCborMsgs[0][0].value === 'ping') {
      console.info("PING detected...")
      let jsonDecodedMsgs = convertArrayToKeyValues( decodedCborMsgs)
       // Exect ^ping+replySelector=apps+replyApi=action+replyEvent=event
//        let replySelector = decodedCborMsgs[0][2]
//        let replyApi = decodedCborMsgs[0][4]
//        let replyEvent = decodedCborMsgs[0][6]
//        //let cborOmapTag = { 'tag': 19, 'value': "replyEvent"}  

        let appClass = 'js.dione.whiteboard'
        let appVersion = '20210404'  //dione release YYYYMMDD  TODO: Make project attribute tied to git branch tag

//       // Respond ^replyEvent+selector=replySelector,nodeName=localClientID+mqttId=localClientID+appClass= +version=app version yymmdd+rtalk=yymmdd(Version)+systemID=systemID+sourceID=systemId
         let msgArray = [ {tag: 211, tag2: -45, value: "event"}, //JSON object with tag: 211
         'selector','apps', 
         'nodeName', 'Dione', 
         'mqttId', 'Dione123456789',
         'appClass', appClass,
         'timeUs','123456',
         'version', appVersion,  
         'rtalk','210103', 
         'messageCount','15',
         'processTimeNs','3004',
         'queueDepth','1',
         'channel','Dione',
         'primaryChannel','dioneView' ]
//         'systemId',localClientID,
//         "sourceId",localClientID ]

         rtCbor.encodeArray(msgArray);  //using Array
         const buffer = Buffer.from(msgArray);
// /** 
//         let msgOmap = {
//           'selector': replySelector, 
//           'nodeName': localClientID, 
//           'mqttId' : mqttConnectOptions.localClientID,
//           'appClass': appClass,
//           'version': appVersion,  
//           'rtalk':'210105', 
//           'systemId': localClientID,
//           "sourceId": localClientID }

//         rtCbor.encodeOmap(replyEvent,msgOmap);  
// */        

//         let sourceReplyAddress = topic.split("/")[0]  // sourceRA is the first topic level
       
         let pingTopic = 'X016OK8G' + ':Dione/' + 'X016OK8G' + '/' + propChannel + '/action/6';
         mqttClient.publish(pingTopic, buffer); //ping response
         //console.info('PUB Message ' + numMsgs + ' - \n Topic: ' + pingTopic + '\n ' + 'Decoded CBOR Message: ', cbor.decodeAllSync(buffer));
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
        <div className="float-left">Client ID: {localClientID}</div>
        <div className="float-right">
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
    mqttConnection: state.mqttConnection,
    subscriptions: state.subscriptions
  };
}

export default connect(mapStateToProps, {sendAction, updateWhiteboard,  updateClientID, updateMqttSubscriptions})(MQTT);
