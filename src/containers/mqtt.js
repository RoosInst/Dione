import React, {Component} from 'react';
import { connect } from 'react-redux';
import Mqtt from 'mqtt';
//import Cbor from 'cbor';
//import PropTypes from 'prop-types'; //used to include { node } 

import { 
  updateMqttClient,
  updateClientId,
  updateCellId,
  updateMqttConnectionStatus,
  removeMqttSubscription,
  addMqttSubscription,
} from '../actions/connectionInfo';

import {
  addApplication
} from '../actions/whiteboardInfo';

import { 
  convertArrayToKeyValues, 
  convertObjToArrayForPublish, 
  getStyleAndCreateHierarchy 
} from '../scripts/functions';

//import { publishArray } from '../scripts/functions';
import '../styles/mqtt.scss';

const RtCbor = require('../scripts/RtCbor');
import cbor from 'cbor';

export let cellID, //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)
  mqttClient;

let numMsgs = 0,
    localClientID, //localClientID used instead of this.props.clientID because localClientID is scoped in componentDidMount, so it won't be updated on next render. Therefore, must make an updating value OUTSIDE of props
    decodedCborMsgs,
    initialWidgetTopic,
    partialWidgetTopic,
    currentWidget,
    propChannel;

let layout = [];

let rtCbor = new RtCbor();

class MQTT extends Component {

  // static propTypes = {
  //   clientID: PropTypes.string.isRequired,
  //   updateWhiteboard: PropTypes.func.isRequired,
  //   updateClientID: PropTypes.func.isRequired,
  //   sendAction: PropTypes.func.isRequired,
  //   mqttConnection: PropTypes.string.isRequired,
  //   localClientID: PropTypes.string,
  //   subscriptions: PropTypes.object.isRequired
  // }

  componentDidUpdate() {
    localClientID = this.props.clientId;
  }
  
  componentDidMount() {
  //**********************
  // MQTT connection setup
  //**********************
    const { clientId,
            cellId,
            updateMqttClient,
    } = this.props;

    localClientID = clientId;

    const mqttHost = 'wss://mqtt.roos.com'; // dev broker'
    //const mqttHost = 'ws://localhost'; //localhost
    const port = '8883'; // local mqtt wss port '8081', server ws '8883'
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
    updateMqttClient(mqttClient);
    console.info('Client ID: ' + localClientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

  //*********************************
  // MQTTCLIENT.ON listenting options
  //********************************* 
    //----------------------------------------------
    // MQTT Connect sequence - adminTopic - appTopic
    //----------------------------------------------
    const adminTopic = 'admin/admin/cellinfo/query/#';  //listen to discover cellID
    mqttClient.on('connect', () => {
      this.props.updateMqttConnectionStatus('connected');
      console.info('Subscribing to admin topic: '+ adminTopic);
      mqttClient.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive message with cellID then UNSUBSCRIBE
    });

    //------------------------
    // MQTT Reconnect sequence 
    //------------------------
    mqttClient.on('reconnect', () => {
      this.props.updateMqttConnectionStatus('reconnecting');
    });

    //X016OK8G:msgTool/X016OK8G/+/actions
    //Main MQTT Parsing loop
    //-----------------------
    // MQTT Message sequence 
    //-----------------------
    mqttClient.on('message', (topic, message) => {
      const { 
        mqttSubscriptions,
        updateCellId,
        updateClientId,
        removeMqttSubscription,
        addMqttSubscription,
        addApplication
      } = this.props;

      const formLayoutArray = (message, target, level) => {
        message.forEach(element => {
          if(element.includes('class')) {
            let owner = element[element.indexOf('owner') + 1];
            let identifier = element[element.indexOf('identifier') + 1];
            if(owner == target) {
              layout.push(`${identifier}`);
              formLayoutArray(message, identifier, level + '->'); 
            }
          }
        });  
      };
    
      numMsgs++;

      //PRINT THE MESSAGE TO THE SCREEN
      try {
        decodedCborMsgs = rtCbor.decodeAll(message);
        if(decodedCborMsgs && decodedCborMsgs.length > 0 && decodedCborMsgs[0].length > 0) 
          console.info('Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' +  'Decoded Message: ', decodedCborMsgs);
        else {
          console.info('Message ' + numMsgs + ' (empty) Received - \n Topic: ' + topic.toString() + '\n ' + 'Decoded Message: ', decodedCborMsgs);
          return;
        }
      } catch(err) {
          console.info(err);
          console.info('ERROR Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' + 'Message: ', message.toString()+ 'ERROR=['+err+']');
          return;
      }      

      //CHECK TO SEE IF MESSAGE HAS ADMIN INFORMATION WE DON'T HAVE
      if(topic.includes('admin/') && !cellID) {
        if ( decodedCborMsgs[0][1] == "cellId") {
          //multiple admin messages could be received
          cellID = decodedCborMsgs[0][2];
          console.info('CellID: ', cellID);
          updateCellId(cellID);

          console.info('Unsubscribing from: ' + adminTopic);
          mqttClient.unsubscribe(adminTopic);

          addMqttSubscription("widget_messages", `+/${cellID}/admin/nodeAdmin/#`);
          mqttClient.subscribe(`+/${cellID}/admin/nodeAdmin/#`, { qos: 2 });

          let msgArray = [null, 'view','console','logger','true'];
          rtCbor.encodeArray(msgArray);
          
          //sanity check encoding
          console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) )
          //COMMENT SECTION #3 (See comment file)
				}
      }

      //CHECK TO SEE IF MESSAGE IS ABOUT CONNECTING/DISCONNECTING A WIDGET
      if(topic.toString().includes("admin/nodeAdmin")) {
        let channel = decodedCborMsgs[0][4];
        let nodeName = decodedCborMsgs[0][6];

        if(topic.toString().includes("disconnect")) {
          removeMqttSubscription(channel);
        } else if(topic.toString().includes("connect")) {
          if(nodeName != "WB") {
            initialWidgetTopic = `${cellID}:${channel}/${cellID}/`;
            currentWidget = channel;

            let newTopic = initialWidgetTopic + '+/action/#';
            addMqttSubscription(channel, newTopic);
            mqttClient.subscribe(newTopic, { qos: 2 });              
              
            //console.info('channel', channel);
            // let message = [null, 'view', 'console'];
            // let topic = 'X016OK8G:RET235R/X016OK8G/' + channel + '/subscribe/4'
            // publishArray(topic, message);
          } else {
            partialWidgetTopic = initialWidgetTopic + channel;   
          }
        } 
      } else if(topic.toString().includes(partialWidgetTopic)) {
        mqttClient.unsubscribe(mqttSubscriptions[currentWidget]);
        removeMqttSubscription(currentWidget);
        let finalWidgetTopic = partialWidgetTopic + '/#';
        addMqttSubscription(currentWidget, finalWidgetTopic);
        mqttClient.subscribe(finalWidgetTopic, { qos: 2 });
       
        partialWidgetTopic = 'WAITING_FOR_A_NEW_WIDGET_TO_LOAD';
        currentWidget = 'none';
      }

      //CHECK TO SEE IF A MESSAGE CONTAINS RENDER INFORMATION
      if (decodedCborMsgs[0][0].value === 'toppane') { //if msg not going to our localClientID, but is still an app (ex. debugging tool)
        let applicationInfo = topic.split('/')[0];
        let model = applicationInfo.split(':')[1];
        let objKeys = convertArrayToKeyValues(decodedCborMsgs);
        let obj = getStyleAndCreateHierarchy(objKeys);
        formLayoutArray(decodedCborMsgs, 'top', '');
        addApplication(layout, model, obj);
        layout = [];
      }

      //CHECK TO SEE IF UPDATING TO A NEW CLIENTID
      else if (topic.includes(cellID + '/GURUBROWSER/subscribe')) { 
          let newClientID = topic.split('/')[0];
          updateClientId(newClientID);
      }

      //MESSAGE TO CLOSE MQTT CONNECTION
      else if (message.toString()=='end') {
        console.info('attempting to close connection');
        mqttClient.unsubscribe('+/+/' + localClientID + '/#');
        mqttClient.end();
      }

      //RTALK PING
      else if (topic.includes('/nodeAdmin') && decodedCborMsgs[0][0].value === 'ping') {
        //NEED TO FIX

        // console.info("PING detected...")

        // let appClass = 'js.dione.whiteboard'
        // let appVersion = '20210404'  //dione release YYYYMMDD  TODO: Make project attribute tied to git branch tag

        // // Respond ^replyEvent+selector=replySelector,nodeName=localClientID+mqttId=localClientID+appClass= +version=app version yymmdd+rtalk=yymmdd(Version)+systemID=systemID+sourceID=systemId
        // let msgArray = [ "event", 
        // "selector","apps", 
        // "nodeName", "Dione", 
        // "mqttId", mqttConnectOptions.clientId,
        // "appClass", appClass,
        // "version", appVersion,  
        // "rtalk","210105", 
        // "messageCount", "5",
        // "processTimeNs", "23424234",
        // "queueDepth", "1",
        // "channel", propChannel ]
      

        // rtCbor.encodeArrayNew(msgArray);  //using Array
        // //let buffer = Buffer.from(msgArray);
        // //let message = Buffer.from("93A363746167633231316474616732632D34356576616C7565656576656E746873656C6563746F726461707073686E6F64654E616D656544696F6E65666D71747449646F44696F6E653233343233353232353368617070436C617373736A732E64696F6E652E7768697465626F6172646776657273696F6E683230323130343034657274616C6B663231303130356C6D657373616765436F756E7461356D70726F6365737354696D654E73683233343234323334676368616E6E656C6970726F707365646974", "hex");

       
        // //let sourceReplyAddress = topic.split("/")[0]  // sourceRA is the first topic level
       
        // let pingTopic = 'X016OK8G:'  + mqttConnectOptions.clientId + `/X016OK8G/` + propChannel + '/action/6';  //GET THE CLIENT ID VARIABLE INSTEAD OF JUST WRITING IT OUT
        // mqttClient.publish(pingTopic, rtCbor.buffers[0]); //Dione responds to the ping letting props know it exists
        // console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) );
        // //console.info('PUB Message ' + numMsgs + ' - \n Topic: ' + pingTopic.toString() + '\n ' + 'Decoded CBOR Message: ', cbor.decodeAllSync(msgArray));
      }
    });

    //-----------------------
    // MQTT Error sequence 
    //-----------------------
    mqttClient.on('error', function(err) {
      console.error("Error: " + err.toString());
    });

    //-----------------------
    // MQTT Close sequence 
    //-----------------------
    mqttClient.on('close', () => {
      console.info("Connection closed");
      this.props.updateMqttConnectionStatus('disconnected');
      cellID = null;
    });
  }

  //-------------------------------------------------------------------------------------------------------
  // ATTEMPT TO START UP MESSAGE TOOL WITHOUT GUI .... 
  //<button style={{marginLeft:'10px'}}onClick={this.handleClick}>Launch MsgTool</button>
  // handleClick() {
  //   let topic = 'X016OK8G:' + consoleChannel + '/X016OK8G/guiLauncher/app/' + numMsgs;  // msgTool0038/X016OK8G/admin/nodeAdmin/3/connect';
  //   let msg = [ 
  //     "runLocal", 
  //     "className","rtalk.tools.RtalkMessageSenderTool" 
  //   ];
  //   rtCbor.encodeArrayNew(msg);
  //   mqttClient.publish(topic, rtCbor.buffers[0]); 
  //   console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) );
  // }
  //-------------------------------------------------------------------------------------------------------

  render() {
  
    return (
      <div styleName='ri-mqtt' >
        <div className="float-left">Client ID: {this.props.clientId}</div>
        <div className="float-right">
          Connection
          <div styleName={`connectionIcon ${this.props.mqttConnectionStatus}`} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  clientId: state.connectionInfo.clientId,
  cellId: state.connectionInfo.cellId,
  mqttConnectionStatus: state.connectionInfo.mqttConnectionStatus,
  mqttSubscriptions: state.connectionInfo.mqttSubscriptions,
})

export default connect(mapStateToProps, { 
  updateMqttClient, 
  updateClientId, 
  updateCellId, 
  updateMqttConnectionStatus, 
  addMqttSubscription, 
  removeMqttSubscription, 
  addApplication
})(MQTT);
