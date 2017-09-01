import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {sendAction, updateWhiteboard } from '../actions';
import { getStyleAndCreateHierarchy, convertArrayToKeyValues } from '../scripts/functions';

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
      sendAction('MQTT_CONNECTED');
  		console.log('Subscribing to admin topic: '+ adminTopic);
  		mqttClient.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive message with cellID then UNSUBSCRIBE
  	});

  	//Main MQTT Parsing loop
  	mqttClient.on('message', function (topic, message) {
      numMsgs++;
      try {
        var decodedCborMsg = cbor.decodeAllSync(message);
        console.info('Message ' + numMsgs + ' Received - \n Topic: ' + topic.toString() + '\n ' + 'CBOR Decoded Message: ', decodedCborMsg);
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
  				console.log('Unsubscribing from: ' + adminTopic);
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
  				console.log('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
  				mqttClient.subscribe(GURUBROWSER_App_Topics, {qos: 2});
  				//PUBLISH to App createSubscriber
  				var appPublishTopic = ra + '/' + cellID + '/rtalk/app/1';
          //mqttClient..publish('GURUBROWSER/' + cellID + '/whiteboard/createSubscriber/1', cbor_createSub);
          console.log("Publishing -\n Topic: " + appPublishTopic + "\n Message: " +  cborPubMsg);
          mqttClient.publish(appPublishTopic, cborPubMsg); //java program should then subscribe to a topic
          //console.log("Publishing -\n Topic: " + ra + '/' + cellID + '/GURUBROWSER/subscribe/1' + "\n Message: " +  cborPubMsgPt2);
          //mqttClient.publish(ra + '/' + cellID + '/GURUBROWSER/subscribe/1', cborPubMsgPt2);
				}
      }
      else if (decodedCborMsg[0][0].value == "toppane") {
        for (var i = 0; i < decodedCborMsg[0].length; i++) {
          if (decodedCborMsg[0][i] === 'model') {
            var ObjFromArray = convertArrayToKeyValues(decodedCborMsg);
            updateWhiteboard(
              getStyleAndCreateHierarchy(ObjFromArray, wb, decodedCborMsg[0][i + 1]) //i+1 b/c model name is i+1
            );
            break;
          }
        }
      }
      else if (wb) {
        var arr = Object.keys(wb);
        for (var i = 0; i < arr.length; i++) {
          if (topic.indexOf(arr[i] + '/' + cellID + '/' + ra) >= 0) { // if message for us @ model/cellID/clientID

            var ObjFromArray = convertArrayToKeyValues(decodedCborMsg);
            updateWhiteboard(
              getStyleAndCreateHierarchy(ObjFromArray, wb, arr[i]) //arr[i] is model name from topic
            );
            break;
          }
        }
      }
      else if (message.toString()=="end") {
       mqttClient.unsubscribe('+/+/' + ra + '/#');
       mqttClient.end();
      }

  	});

  	mqttClient.on('error', function(err) {
  		console.log("Error: " + err.toString());
  	});


  	mqttClient.on('close', function () {
  		console.log("Connection closed");
  		sendAction('MQTT_DISCONNECTED');
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

export default connect(mapStateToProps, {sendAction, updateWhiteboard })(MQTT);
