/*-----------------------------------------------------------------------------------------
  startMQTT_rb.js.
  MQTT connection to RI Guru with Node.js for JS rTalkApps
  Supported Apps: GURUBROWSER
  Joseph Theberge & Ryan Benech
  08/25/16 early alpha
  3/6/16 cbor tagging
  ------------------------------------------------------------------------------------------
*/

import React from 'react';


var mqtt    = require('mqtt');
var cbor	= require('cbor');

//identifications
const clientID = "JS" + Math.random().toString(16).substr(2, 6);  //ka mqtt session ID, Return Address (ra)
const ra = clientID; //set return adress to client ID
var cellID;  //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)

const mqttBroker = 'ws://localhost:8080';  // websocket port (ws) (init by rTalkDistribution/moquette/bin/moquette.sh)

//class omapCbor_createSub {
//	constructor () {
//		this.fun = 'createSubscriber';
//		this.msgkey = 'className';
//		this.msgval = 'RiRmtViewGuru';
//	}
//	encodeCBOR (encoder) {
//		const cbor_createSub = new Tagged(211, [this.fun, this.msgkey, this.msgval]);
//		const cbor_viewDef = new Tagged(211, ['viewDef', 'view', 'Browser']);
//		var buffer;
//		buffer = encoder.pushAny(cbor_createSub);
//		buffer = encoder.pushAny(cbor_viewDef);
//		return buffer;
//	}
//};

//var createSubMsgTagged = new omapCbor_createSub();

//console.log(cbor.encode(createSubMsgTagged));

var mqttConnectOptions = {
	clientId: "mqtt-" + clientID //MQTT ID is "mqtt-" plus clientID
	//rejectUnauthorized: false	//false for self-signed certificates, true in production
	}; 

console.info('Client ID: '+ clientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

const adminTopic = 'admin/+/cellinfo/info/#';  //only used to discover cellID
var appSubscribeTopic = 'GURUBROWSER/' + clientID + '/createSubscriber/1';  //vars updated after cellID discovered
var GURUBROWSER_App_Topics = ['GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
var appWbTopic = clientID + '/GURUBROWSER/subscribe/1';

const createSubscriberMsg = cbor.encode(['createSubscriber','className','RiRmtViewGuru'],['viewDef','view','Browser']); //todo: tag each array with 211
var viewDefMsg = cbor.encode(['viewDef','view','Browser']); //todo: tag with 211

var store = {};  //react JSON
var client  = mqtt.connect(mqttBroker, mqttConnectOptions);

function storeMsg(store, decodedCbor) {
	var msgObj = {};
	
	//Assigns keys and values through arrays passed in decodedCbor
	for (var array = 0; array < decodedCbor.length; array++) {
		for (var i = 2; i < decodedCbor[array].length; i=i+2) {
			msgObj[decodedCbor[array][1]] = decodedCbor[array][1]; //toppane, subpane, etc.
			msgObj[decodedCbor[array][i]] = decodedCbor[array][i+1];
		}
		if (store[decodedCbor[array][1]] != decodedCbor[array][1]) {
			store[decodedCbor[array][1]] = msgObj;
		}
		//else store[array] = 
		store[array] = msgObj;
		msgObj = {};
		//console.log("Continuing to new array, msgObj so far: ", msgObj);
	}
	console.log("Store: ", store); //Note: Chrome inspector sorts elements alphabetically when viewing console, not by order received							
	return store;
}

// MQTT Connect sequence - adminTopic - appTopic
client.on('connect', function () {
	console.log('Subscribing to admin topic: '+ adminTopic);
	client.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive cellID then UNSUBSCRIBE
});

var test = [[0, 1, 2, -1], [3, 4, 5, 6]];


function findValue(arr, key) { //handles 1D, 2D arrays
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] instanceof Array) {
			for (let j = 0; j < arr[i].length; j++)
				if (arr[i][j] == key) {
					return arr[i][j+1];
				}
		} else {
		 	if (arr[i] == key) {
					return arr[i+1];
			}
		}
	}
}

//function findValue(arr, key, value) {
//	for (let i = 0; i < arr.length; i++) {
//		if (arr[i] instanceof Array) {
//			value = findValue(arr[i], key);
//		} else {
//			console.log("array[i]: ", arr[i]);
//			if (arr[i] == key) {
//				value = arr[i+1];
//				console.log("Key found. Value: ", value);
//				return value;
//			} else {
//				console.log("Value: ", value);
//			}
//		}
//	}
//	return value;
//}

console.log("VAL: ", findValue(test, 2));

//Main MQTT Parsing loop
client.on('message', function (topic, message) {
	var cborMsg = cbor.decodeAllSync(message);
	console.info('Message Received - \nTopic: ' + topic.toString() + '\n' + 'CBOR Decoded Message: ', cborMsg);
	console.log("Storing Message.");
		storeMsg(store, cborMsg);
	//cell registration
	if (topic.includes("admin/")) {
		//REGISTERING CELLID
		if ( cborMsg[0][1] == "cellId") {
			//multiple admin messages could be received
			cellID = cborMsg[0][2];
			console.info('CellID: ', cellID);
			//UNSUBSCRIBE
			console.log('Unsubscribing from: ' +adminTopic);
			client.unsubscribe(adminTopic);
			//SUBSCRIBE
			GURUBROWSER_App_Topics = ['GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
			console.log('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);	
			client.subscribe(GURUBROWSER_App_Topics, {qos: 2});
			//PUBLISH to App createSubscriber
			appSubscribeTopic = 'whiteboard/'+cellID +'/rtalk/app/1';
			//console.log('Publishing createSubscriber: ' + cbor.decodeAllSync(createSubMsgCBOR) + '\nTo Topic: ' + appSubscribeTopic);		
			//client.publish(appSubscribeTopic, createSubMsgCBOR);  //send createSubMsg to register this JS_App
			}
		
		client.publish(createSubscriberMsg, appSubscribeTopic);

		//UNSUBSCRIBE
		//console.log('Unsubscribing to: GURUBROWSER/' + clientID + '/createSubscriber/1');
		//client.unsubscribe('GURUBROWSER/' + clientID + '/createSubscriber/1');
	
	//app registration
	} else if (topic == GURUBROWSER_App_Topics[0]) {
		// rTalk message ^viewDef+view=Browser on 'GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1'
		// task: open new whiteboard (this) and send registration message ^viewDef+view=Browser to GURUBROWSER/whiteboard/createSubscriber/1
		if (cborMsg[0][1] == 'viewDef') {
			// echo message to 
			console.log('2 Forwarding subscription requiest: ' + message + '\nTo Topic: ' + GURUBROWSER_App_Topics[1]);		
			client.publish(GURUBROWSER_App_Topics[1], message);
			console.log('Compare! Valid CBOR:' + cbor.decodeAllSync(message) + '\nCreated CBOR: ' + cbor.decodeAllSync(viewDefMsg));		
		}
				
	} else if (topic.includes(clientID)) {
			console.log("Storing Message: ", cborMsg);
			storeMsg(store, cborMsg);
	}

  if (message.toString()=="end") {
	 client.unsubscribe('+/+/' + clientID + '/#');
	client.end();
  }
});

client.on('error', function(err) {
	console.log("Error: " + err.toString());
});


const Blank = () => {return;}
export default Blank;