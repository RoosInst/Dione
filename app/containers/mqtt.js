import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {sendAction, updateWhiteboard, updateClientID, MQTT_CONNECTED, MQTT_DISCONNECTED, MQTT_RECONNECTING } from '../actions';

const mqtt = require('mqtt');
const cbor = require('cbor');
const assert  = require('assert');

export var mqttClient = null;
export var cellID = null;   //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)
var numMsgs = 0;

var ra = null;
var wb = null;

class MQTT extends Component {
  componentDidUpdate() {
    wb = this.props.whiteboard;
    ra = this.props.clientID;
  }
  componentDidMount() {
    const mqttHost = 'ws://localhost';
    const port = '8081';
    ra = this.props.clientID; //set return adress to clientID
    wb = this.props.whiteboard;
    const sendAction = this.props.sendAction;
    const updateWhiteboard = this.props.updateWhiteboard;
    const updateClientID = this.props.updateClientID;
    const mqttBroker = mqttHost + ':' + port + '/mqtt';  // websocket port (ws) (init by rTalkDistribution/moquette/bin/moquette.sh)
    const mqttConnectOptions = {
      clientId: "mqtt_" + ra //MQTT ID is "mqtt-" plus clientID
      //rejectUnauthorized: false	//false for self-signed certificates, true in production
    };
    mqttClient = mqtt.connect(mqttBroker, mqttConnectOptions);

    //riri separators
  //  var riri_1C = Buffer.from('1c', 'hex'); //^ hex 0x1C, first level separator, parameters, ^parameter^parameter
  //  var riri_1D = Buffer.from('1d', 'hex'); //+ hex 0x1D, second level separator, attributes, +key=value or +value
  //  var riri_1E = Buffer.from('1e', 'hex'); //~ hex 0x1E, third level, ArrayElements, ~item~item
  //  var riri_1F = Buffer.from('1f', 'hex'); //# hex 0x1F, fourth level and touples, shown as #item#item
    var omap_start = Buffer.from('9f', 'hex'); // hex x9F, cbor start byte for unbounded arrays
    var omap_cborTag = Buffer.from('d3', 'hex'); // hex xD3, start object map (omap cbor tag)
    var omap_end = Buffer.from('ff', 'hex'); // hex xFF, cbor end byte for unbounded arrays
    var cbor_null = Buffer.from('f6', 'hex'); // hex 0xF6, null (string==null, aka empty omap)

      //cbor.encode automatically creates buffer, no need to use Buffer.from(...)
      const classNameSM = cbor.encode('className');
      const createSubSM = cbor.encode('createSubscriber');
      const RiRmtViewGuruSM = cbor.encode('RiRmtViewGuru');

      const viewDefSM = cbor.encode('viewDef');
      const viewSM = cbor.encode('view');
      const browserSM = cbor.encode('Browser');


    var cborPubMsg = Buffer.concat([omap_start, omap_cborTag, createSubSM, classNameSM, RiRmtViewGuruSM, omap_end]);
    var cborPubMsgPt2 = Buffer.concat([omap_start, omap_cborTag, viewDefSM, viewSM, browserSM, omap_end]);
  //  cborPubMsg = Buffer.concat([cborPubMsg, cborPubMsgPt2]);

  	console.info('Client ID: '+ ra); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

  	const adminTopic = 'admin/+/cellinfo/info/#';  //only used to discover cellID
  	var appSubscribeTopic = 'GURUBROWSER/' + ra + '/createSubscriber/1';  //vars updated after cellID discovered

  //-------------------------------------
  //-----MQTTCLIENT.ON LISTENING OPTIONS-----
  //-------------------------------------
  	// MQTT Connect sequence - adminTopic - appTopic
  	mqttClient.on('connect', function () {
      sendAction(MQTT_CONNECTED);
  		console.info('Subscribing to admin topic: '+ adminTopic);
  		mqttClient.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive message with cellID then UNSUBSCRIBE
  	});

  	//Main MQTT Parsing loop
  	mqttClient.on('message', function (topic, message) {
      numMsgs++;
      try {
        var decodedCborMsg = cbor.decodeAllSync(message);
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
          var channelID = '+';
          const domainTopic = '+/' + cellID + '/#';
          const wbCreateSubTopic = '+/' + cellID + '/whiteboard/createSubscriber/1'; //get app ID
          var GURUBROWSER_App_Topics = [
            domainTopic,
            wbCreateSubTopic,
            channelID + '/'+ cellID + '/' + ra + '/+/subscribe/1',
            channelID + '/' + cellID + '/'+ra +'/action/1'
           ];
  				console.info('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
  				mqttClient.subscribe(GURUBROWSER_App_Topics, {qos: 2});

          var consoleCreateSub = Buffer.from('9fd3f6647669657767436f6e736f6c65ff', 'hex');
          var consoleCreateSubTopic = 'console/X1PD0ZR3/whiteboard/createSubscriber/8';

          var selectGuruApp = Buffer.from('9fd3656576656e7466776964676574676170704d656e75676368616e6e656c6854304a39393930376973656c656374696f6e6c0141412b6752756e204170706d73656c656374696f6e6170707369014167414967757275ff', 'hex');
          var guruAppTopic = ra + '/X1PD0ZR3/console/action/1';
         console.log('publishing');
          mqttClient.publish(consoleCreateSubTopic, consoleCreateSub);
          mqttClient.publish(guruAppTopic, selectGuruApp); //launches guru app
				}
      }
      else if (topic.includes(cellID + '/' + ra) && !topic.includes('console')) {
        var model = topic.split('/')[0];
        updateWhiteboard(decodedCborMsg, model);
      }

      else if (topic.includes(cellID + '/GURUBROWSER/subscribe')) { //update to newly received clientID
          var newClientID = topic.split('/')[0];
          updateClientID(newClientID);
      }

      else if (message.toString()=='end') {
       mqttClient.unsubscribe('+/+/' + ra + '/#');
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
