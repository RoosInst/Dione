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

const mqtt = require('mqtt');
const cbor = require('cbor');
const assert  = require('assert');

const MQTT = ({Connected, Disconnected, Reconnecting, ClientID}) => {



  //riri separators
  var riri_1C = String.fromCharCode(28); //^ hex 0x1C, first level separator, parameters, ^parameter^parameter
  var riri_1D = String.fromCharCode(29); //+ hex 0x1D, second level separator, attributes, +key=value or +value
  var riri_1E = String.fromCharCode(30); //~ hex 0x1E, third level, ArrayElements, ~item~item
  var riri_1F = String.fromCharCode(31); //# hex 0x1F, fourth level and touples, shown as #item#item
  var omap_start = String.fromCharCode(159); // hex x9F, cbor start byte for unbounded arrays
  var omap_cborTag = String.fromCharCode(211); // hex xD3, start object map (omap cbor tag)
  var cbor_end = String.fromCharCode(255); // hex xFF, cbor end byte for unbounded arrays
  var cbor_null = String.fromCharCode(246); // hex 0xF6, null (string==null, aka empty omap)

  //array to buffer
  const createSubscriberMsgObjArray = 'className=RiRmtViewGuru';
  const createSubscriberMsgArray = [riri_1C + 'createSubscriber', 'className=RiRmtViewGuru'];
  const viewDefMsgArray = [riri_1C + 'viewDef','view=Browser'];
  const createSubBody = cbor.encode(['className','RiRmtViewGuru',255]);
  //const createSubscriberMsg = Buffer().write(createSubscriberMsgRiRi);


  //riri as string (buffer)
  const createSubscriberMsgRiRi = omap_start + omap_cborTag + riri_1C + 'createSubscriber' + riri_1D + 'className=RiRmtViewGuru' + cbor_end;
  const viewDefMsgRiri = omap_start + 'viewDef' + riri_1D + 'view=Browser' + cbor_end;
  const createSubscriberMsg = cbor.encode(createSubscriberMsgRiRi, cbor_end, viewDefMsgRiri ,cbor_end);
  //var createSubscriberMsg = new Buffer(1000);
//  createSubscriberMsg.write(createSubscriberMsgRiRi);
  var viewDefMsg = viewDefMsgRiri;

  var cbor_createSub = new cbor.Tagged(211, 'createSubscriber');
  cbor_createSub = cbor.encode([cbor_createSub,createSubscriberMsgObjArray]);



	//identifications
 console.log(ClientID);
	const ra = ClientID; //set return adress to client ID
	var cellID;  //sent by rTalk + GuruServer connected to the MQTT broker (init by rTalkDistribution/startWin64.bat), holds the model for this UI instance (aka host)

	const mqttBroker = 'ws://localhost:8081';  // websocket port (ws) (init by rTalkDistribution/moquette/bin/moquette.sh)

	var mqttConnectOptions = {
		ClientId: "mqtt-" + ClientID //MQTT ID is "mqtt-" plus ClientID
		//rejectUnauthorized: false	//false for self-signed certificates, true in production
		};

	console.info('Client ID: '+ ClientID); // (currently unique at each run, persist as cookie or guru logon to make apps survive refresh)');

	const adminTopic = 'admin/+/cellinfo/info/#';  //only used to discover cellID
	var appSubscribeTopic = 'GURUBROWSER/' + ClientID + '/createSubscriber/1';  //vars updated after cellID discovered
	var GURUBROWSER_App_Topics = ['GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
	var appWbTopic = ClientID + '/GURUBROWSER/subscribe/1';

	//const createSubscriberMsg = cbor.encode(['createSubscriber','className','RiRmtViewGuru'],['viewDef','view','Browser']); //todo: tag each array with 211
	//viewDefMsg = cbor.encode(['viewDef','view','Browser']); //todo: tag with 211

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


//-------------------------------------
//-----CLIENT.ON LISTENING OPTIONS-----
//-------------------------------------
	// MQTT Connect sequence - adminTopic - appTopic
	client.on('connect', function () {
    {Connected()}
		console.log('Subscribing to admin topic: '+ adminTopic);
		client.subscribe(adminTopic, {qos: 2}); //after subscribe, should receive message with cellID then UNSUBSCRIBE
	});

	//Main MQTT Parsing loop
	client.on('message', function (topic, message) {
		var cborMsg = cbor.decode(message);
		console.info('Message Received - \nTopic: ' + topic.toString() + '\n' + 'CBOR Decoded Message: ', cborMsg);
		//console.log("Storing Message.");
			//storeMsg(store, cborMsg);
		//cell registration
		if (topic.includes("admin/")) {
			//REGISTERING CELLID
			if ( cborMsg[1] == "cellId") {
				//multiple admin messages could be received
				cellID = cborMsg[2];
				console.info('CellID: ', cellID);

        //UNSUBSCRIBE
				console.log('Unsubscribing from: ' + adminTopic);
				client.unsubscribe(adminTopic);

        //SUBSCRIBE
        GURUBROWSER_App_Topics = ['GURUBROWSER/' + cellID + '/whiteboard/createSubscriber/1', ra+'/'+cellID+'/GURUBROWSER/subscribe/1', 'T0A597LL/'+cellID+'/'+ra+'/action/1'];
				console.log('Subscribing to GURUBROWSER Topics: ' + GURUBROWSER_App_Topics);
				client.subscribe(GURUBROWSER_App_Topics, {qos: 2});
				//PUBLISH to App createSubscriber
				var appPublishTopic = 'whiteboard/' + cellID + '/rtalk/app/1';
        //client.publish('GURUBROWSER/' + cellID + '/whiteboard/createSubscriber/1', cbor_createSub);
        client.publish(appPublishTopic, cbor_createSub);
      //console.log(cbor_createSub);
        //console.log("Published");
				//console.log('Publishing createSubscriber: ' + cbor.decodeAllSync(createSubMsgCBOR) + '\nTo Topic: ' + appSubscribeTopic);
				//client.publish(appSubscribeTopic, createSubMsgCBOR);  //send createSubMsg to register this JS_App
				}

			//client.publish(createSubscriberMsg, appSubscribeTopic);

			//UNSUBSCRIBE
			//console.log('Unsubscribing to: GURUBROWSER/' + ClientID + '/createSubscriber/1');
			//client.unsubscribe('GURUBROWSER/' + ClientID + '/createSubscriber/1');

		//app registration
		} else if (topic == GURUBROWSER_App_Topics[0]) {
			// rTalk message ^viewDef+view=Browser on 'GURUBROWSER/' + cellID + 'whiteboard/createSubscriber/1'
			// task: open new whiteboard (this) and send registration message ^viewDef+view=Browser to GURUBROWSER/whiteboard/createSubscriber/1
			if (cborMsg[0][1] == 'viewDef') {
				// echo message to
				console.log('2 Forwarding subscription request: ' + message + '\nTo Topic: ' + GURUBROWSER_App_Topics[1]);
				client.publish(GURUBROWSER_App_Topics[1], message);
				console.log('Compare! Valid CBOR:' + cbor.decodeAllSync(message) + '\nCreated CBOR: ' + cbor.decodeAllSync(viewDefMsg));
			}

		} else if (topic.includes(ClientID)) {
				console.log("Storing Message: ", cborMsg);
				storeMsg(store, cborMsg);
		}

	  if (message.toString()=="end") {
		 client.unsubscribe('+/+/' + ClientID + '/#');
		client.end();
	  }
	});

	client.on('error', function(err) {
		console.log("Error: " + err.toString());
	});


	client.on('close', function () {
		console.log("Connection closed");
		{Disconnected()}
	});



	// IsConnected({'mqttConnect': client.connected});
	return <div />; //Don't want to actually display any HTML, just want to be able to change store
}

export default MQTT;
