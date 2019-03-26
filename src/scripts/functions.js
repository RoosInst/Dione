/*Here exists functions essential to building the app.*/
import React from 'react';
import {mqttClient, cellID} from '../containers/mqtt';
import RtCbor from "../scripts/RtCbor"

//const cbor = require('cbor');

const

  RIRISEP3 = '\u001e', //RIRI level 3 separator - RS - '~'

  omap_start = Buffer.from('9f', 'hex'), // hex x9F, cbor start byte for unbounded arrays
  omap_cborTag = Buffer.from('d3', 'hex'), // hex xD3, start object map (omap cbor tag)
  omap_end = Buffer.from('ff', 'hex'), // hex xFF, cbor end byte for unbounded arrays

  base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";  //used for base64 encode/decode

//TODO var cborEncodeArrayIndef()

/* Not currently used, but might be useful later
cbor_null = Buffer.from('f6', 'hex'), // hex 0xF6, null (string==null, aka empty omap)
RIRISEP1 = '\u001c', //RIRI level 1 separator - FS - '^'
RIRISEP2 = '\u001d', //RIRI level 2 separator - GS - '+'
RIRISEP4 = '\u001f', //RIRI level 4 separator - US - '/'riStringCheckAndConvert
*/


function getFrameRatioFor(val) {
  let frameRatio = {},
    doing = 0, //start with 0 (left)
    p0 = 0; //index of start of substring

  for (let i = 0; i < val.length; i++) { //walk through the string
    if (val[i] === ';' || val[i] === '@') { //split on separators
      switch (doing) {
        case 0: frameRatio.left = parseInt(val.substring(p0, i), 10); break; //left
        case 1: frameRatio.top = parseInt(val.substring(p0, i), 10); break; //top
        case 2: frameRatio.right = parseInt(val.substring(p0, i), 10); break; //right
      }
      p0 = i + 1; //next
      doing++; //next
    }
  }
  frameRatio.bottom = parseInt(val.substring(p0, val.length), 10); //bottom
  return frameRatio;
}

/**Returns the given frameratio string (i.e. '20@100;50@60' or '20;100;50;60')
 * as a json object: { left:20, top:100, right:50, bottom:60 }
 * */
function makeStyleFromFrameRatio(val) {
  let frameRatio = getFrameRatioFor(val),
    wd, ht, xpos, ypos;

  if (frameRatio) { //frameRatio is percent values for: left, right, top, bottom
    wd = (frameRatio.right - frameRatio.left) + '%';
    ht = (frameRatio.top - frameRatio.bottom) + '%';
    xpos = frameRatio.left;
    ypos = 100 - frameRatio.top;
  }
  else {
    wd = 'auto';
    ht = 'auto';
    xpos = 0;
    ypos = 0;
  }
  return ({ position: "absolute", left: xpos + "%", top: ypos + "%", width: wd, height: ht });
}


/*unSortedStore is flat obj containing everything after converted from array.
whiteboard is current existing state of all apps in a hierarchical object.
Function nests objects into its owners (makes flat obj into hierarchical)
 and creates "style" key with values for positioning for each obj with frameRatio.
 Also decodes riri strings into array of usable objects.*/
export function getStyleAndCreateHierarchy(unsortedStore, whiteboard, model) {
  let forest = {},
    tree = {}; //copy of whiteboard if exists

  if (whiteboard) {
    forest = $.extend({}, whiteboard); //deep clone, do not alter redux store (treat as immutable)
    if (whiteboard[model]) { //if app exists in whiteboard
      tree = forest[model];
    }
    else if (unsortedStore.top) {
      tree = unsortedStore.top;
    }
  }
  else if (unsortedStore.top) {
    tree = unsortedStore.top;
  }
  else {
    console.error('ERR: tree not properly copied. \nunsortedStore:', unsortedStore, '\nwhiteboard:', whiteboard, '\nmodel:', model);
    return -1;
  }

  for (let key in unsortedStore) {
    // skip loop if the property is from prototype
    if (!unsortedStore.hasOwnProperty(key)) continue;

    let obj = unsortedStore[key];

    if (Array.isArray(obj)) insertObject(tree, obj);
    else {
      //value (not contents) for context menus
      if (obj.value) { //obj.value always an array
        let arr = [];
        //search for pairs (ex. in scope=local, scope will have riri, local won't)
        for (let j = 0; j < obj.value.length - 1; j++) {
          if (typeof obj.value[j] === 'string' && typeof obj.value[j + 1] === 'string' && obj.value[j].includes('\u0001') && !obj.value[j + 1].includes('\u0001')) { //if array contains pairs
            if (arr.length === 0) console.warn('WARNING: Both riri and non-riri strings detected in obj.value ', obj.value, 'Detected pairs and combining.'); //only make error message once, so checks arr.length

            arr.push(obj.value[j] + '=' + obj.value[j + 1]);
            j++; //increment j twice at end of loop
          }
          else if (typeof obj.value[j] !== 'string') console.error('ERR: Unrecognized obj.value:', obj.value[j]);
          else if (typeof obj.value[j + 1] !== 'string') console.error('ERR: Unrecognized obj.value:', obj.value[j + 1]);
        }

        if (arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            let tempArr = parseSmMsgs(arr[i]); //returns array
            arr[i] = tempArr[0]; //because storing each val in an array already, remove inner array by indexing [0]
          }
        }
        else {
          for (let i = 0; i < obj.value.length; i++) {
            if (typeof obj.value[i] === 'string') {
              let tempArr = parseSmMsgs(obj.value[i]); //returns array
              arr[i] = tempArr[0]; //because storing each val in an array already, remove inner array by indexing [0]
            } else { console.error('ERR: Unrecognized obj.value:', obj.value[i]) }
          }
        }
        obj.value = arr;
      }

      if (obj.contents) {
        obj.contents = parseSmMsgs(obj.contents);
      }

      if (obj.frameRatio) {
        obj.style = makeStyleFromFrameRatio(obj.frameRatio);
      }

      if (obj.owner) {
        if (obj.owner === 'top') {
          tree[obj.identifier] = obj;
        }
        else {
          insertObject(tree, obj);
        }
      }
      else if (!obj.identifier) { //checks not toppane, because toppane has id but not owner

        //if object is to replace portions in top, then this replaces those pieces
        let entries = Object.entries(obj);
        for (let i = 0; i < entries.length; i++) {
          if (entries[i][0] === 'attributes') {
            let attributeEntries = Object.entries(entries[i][1]);
            if (!tree['attributes']) tree['attributes'] = {};
            for (let j = 0; j < attributeEntries.length; j++) {
              tree['attributes'][attributeEntries[j][0]] = attributeEntries[j][1];
            }
          }
          else tree[entries[i][0]] = entries[i][1];
        }
      }
    }
  }
  forest[tree.model] = tree;
  return forest;
}



function insertObject(tree, passedObj) { //handles both "real" objects and arrays (arrays === objects)
  let found = false;
  if (Array.isArray(passedObj)) {
    passedObj.map(objFromArr => recursiveCheck(tree, objFromArr));
  } else recursiveCheck(tree, passedObj);

  function recursiveCheck(newObj, obj) { //if called again, found = false
    if (!obj) return; //sometimes undefined, so just ignore and return nothing

    if (newObj[obj.value]) { //if arr, will be true, else obj, will be false
      found = true;
      newObj[obj.value].contents = parseSmMsgs(obj.contents);

      /* Must fix to regain support for highlight attribute, but no app supported currently uses this so leaving commented out for now (must find correct index of content with highlight)
      if (obj.highlight) {
        newObj[obj.value].contents[i].highlight = obj.highlight;
      }
      */

      return; //no need to continue with checking
    }

    else if (newObj[obj.owner]) { //if obj, will be true, else arr, will be false
      newObj[obj.owner][obj.identifier] = obj;
      found = true;
      return; //no need to continue with checking
    }

    else { //else found=false, look for owner (objVal) with recursion
      let tempEntries = Object.entries(newObj);
      for (let i = 0; i < tempEntries.length; i++) {
        if (tempEntries[i][0] !== 'style' && typeof tempEntries[i][1] === 'object' && Object.prototype.toString.call(tempEntries[i][1]) !== '[object Array]') {
          if (newObj[tempEntries[i][0]]) recursiveCheck(newObj[tempEntries[i][0]], passedObj);
        }
      }
    }
    //if still not found after searching everything
    if (!found) { //if still not found after recursion executed above
      let owner = obj.owner || obj.value; //owner = object's value in array of objects
      let objID = obj.identifier ? obj.identifier : obj;
      console.error('ERR:', objID, 'object\'s owner', owner, 'not found!');
      found = true; //set found to true so message doesn't repeat in console
    }
  }
}



/*Converts the message of arrays into flat object. Exception: values is array of objs*/
export function convertArrayToKeyValues(decodedCbor) {
  if (decodedCbor == null) {
    return;
  }

  let store = {};

  for (let array = 0; array < decodedCbor.length; array++) {
    let msgObj = {};

    if (decodedCbor[array][1] === 'contents') {
      msgObj['value'] = decodedCbor[array][0].value;
    }

    for (let i = 1; i < decodedCbor[array].length; i = i + 2) {
      if (decodedCbor[array][i] === 'attribute') { //if multiple attributes, make/add to an obj of attributes instead of replacing each attribute w/ latest
        if (!msgObj['attributes']) msgObj['attributes'] = {};
        let splitVal = decodedCbor[array][i + 1].split('=');
        msgObj['attributes'][splitVal[0]] = splitVal[1];
      }
      else msgObj[decodedCbor[array][i]] = decodedCbor[array][i + 1];
    }

    if (msgObj.identifier) {
      store[msgObj.identifier] = msgObj;
    }

    //values (not to be confused with value, stores all contents when something changes)
    if (msgObj.value && msgObj.contents != null) { //not null, but can be empty string
      if (store['values']) {
        store['values'].push(msgObj);
      } else {
        store['values'] = [msgObj];

      }
    }

    if (decodedCbor[array][0].value === 'top') {
      store['top'] = msgObj;
    }

    else if (decodedCbor[0][0].value === 'dialog') { //note: [0][0] not [array][0] because contents are received in different array index
      if (msgObj.contents) { //will contain three msgObjs, but only one with contents. Use only one with contents (other 2 are empty objs)
        if (!store['top']) store['top'] = {}; //want to statically place dialogs inside top of model (instead of dynamically with assigning an unnecessary owner)
        msgObj.contents = parseSmMsgs(msgObj.contents);
        store['top']['dialog'] = msgObj;
      }
    }
  }
  return store;
}






/**Given a string, checks if the String is a RIRI encoded RiString.
* If so converts it, otherwise returns obj with object.text = string
* The returned riString object will have the following properties:
*   text, indent, color, font, tag, action, header
* All are optional except for 'text'.
* Note that the values for 'indent', 'color', 'font', and 'tag' are all integers.
* 'text' and 'action' are strings
* 'header' is the binary header portion used to emit the riString as RIRI.
* */
function riStringCheckAndConvert(s) {

  if (!s || s.length === 0) return s;

  let isType2;

  switch (s[0]) {
    case '\u0001': isType2 = false; break;
    case '\u0002': isType2 = true; break;
    default: {
      let obj = {};
      obj['text'] = s;
      return obj; //is a regular string (neither type 1 or type 2). Return obj with text key's value as string
    }
  }

  let val,
    rawHeaderBytes = isType2 ? s.slice(1, 5) + 'A' + s.slice(5, 7)  //type 2 header. The two padding bytes allow the 'action' string length to be properly decoded using base 64
      : s.slice(1, 5), //ignore 1st byte, the next 4 is the type 1 header
    headerOffset = isType2 ? 7 : 5, //location after header, (type1 = 5, type2 = 7)
    actionLength = 0,  //length of the (type 2) action portion
    temp,
    riString = {};

  try {
    val = base64Decode(rawHeaderBytes);  //extract the, base 64 encoded, type1 header portion
    //temp = base64Encode(val, 4); //test the reverse action (debug)

    if (isType2) { //for type 2 decode the 'action' string
      //determine the action command length then extract it
      actionLength = ((rawHeaderBytes[4] & 0xff) << 8) + (rawHeaderBytes[5] & 0xff); //convert to int
      if (headerOffset + actionLength > s.length) { //check that specified action string length is not larger than available bytes.
        console.error('Error parsing RiString (type 2) action cmd because of length: action cmd length=' + actionLength + '. Available string length=' + s.length - headerOffset);
        actionLength = 0; //if so then set action string to zero so that bytes show up in the regular string data (to help in debug)
      }
      let tempAction = s.slice(headerOffset, headerOffset + actionLength);
      if (tempAction) riString.action = tempAction;
    }

    temp = ((val >>> 20) & 0xf); //color: 4 bits
    if (temp !== 0) riString.color = temp; //create entry only if actually has a value

    temp = ((val >>> 16) & 0xf); //indent: 4 bits
    if (temp !== 0) riString.indent = temp;

    temp = ((val >>> 14) & 0x3); //font: 2 bits
    if (temp !== 0) riString.font = temp;

    temp = (val & 0x3fff); //tag: 14 bits
    if (temp !== 0) riString.tag = s.slice(headerOffset + actionLength, headerOffset + actionLength + temp);
  }
  catch (e) {
    console.error('Unable to convert RiString header because: ' + e);
    return -1;
  }

  if (riString.tag !== undefined) { //may be empty string
    let tempText = s.slice(headerOffset + actionLength + riString.tag.length);  //cut off tag
    if (tempText.length > 0) riString.text = tempText; //if tag != text, set text to tempText
    else {
      riString.text = riString.tag; //else if tag === text, make text = tag
      delete riString.tag;
    }
  } else riString.text = s.slice(headerOffset + actionLength);

  riString.header = isType2 ? s.slice(0, 7) : s.slice(0, 5); //the raw header portion

  return riString;
}





/**Given an RiString returns a fomatted JSX list <li>...</li> element*/
export function getRiStringAsLi(model, riString, key, obj, clientID, handleClick, selectedItems) {

  //if no text field then it's not an RiString
  if (!riString.text) return <li key={key}>{riString}</li>;

  let riStringContent;
  if (riString.header) {
    if (riString.tag) {
      riStringContent = riString.header + riString.tag + riString.text;
    }
    else riStringContent = riString.header + riString.text
  }
  else riStringContent = riString.text;

  let selectedItemContent;
  if (selectedItems && selectedItems[model] && selectedItems[model][obj.identifier] && selectedItems[model][obj.identifier]) {
    selectedItemContent = selectedItems[model][obj.identifier];
    if (selectedItemContent.text) {
      if (selectedItemContent.header) {
        if (selectedItemContent.tag) {
          selectedItemContent = selectedItemContent.header + selectedItemContent.tag + selectedItemContent.text;
        } else selectedItemContent = selectedItemContent.header + selectedItemContent.text
      } else selectedItemContent = selectedItemContent.text;
    }
  }

  return (
    <li onClick={() => handleClick(riString, obj)}
      key={key}
      className={`${riString.color ? 'rsColor' + riString.color : ''} ${riString.font ? 'rsStyle' + riString.font : ''} ${selectedItemContent === riStringContent ? 'active' : ''}`}
    >
      {riString.indent && riStringNbsp(riString.indent)}
      {riString.text}
    </li>
  );
}





/**Returns a string with the indicated number of spaces*/
function riStringNbsp(len) {
  if (len <= 0) return '';
  switch (len) {
    case 1: return '&nbsp '; case 10: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp '; //note: added an extra regular space because it helps the old firefox browser
    case 2: return '&nbsp&nbsp '; case 9: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
    case 3: return '&nbsp&nbsp&nbsp '; case 8: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
    case 4: return '&nbsp&nbsp&nbsp&nbsp '; case 7: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
    case 5: return '&nbsp&nbsp&nbsp&nbsp&nbsp '; case 6: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
  }
  let a = '';
  let len10 = Math.floor(len / 10);
  for (let i = 0; i < len10; i++) { a += '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'; } //the big chunks
  return a + riStringNbsp(len - len10 * 10) + ' '; //the remainder.  note: added an extra regular space because it helps the old firefox browser
}


/**Base64 decode: Converts to integer from base 64 string (or array).
 * Note: this one derived from the smalltalk method 'riBase64Integer'
 */
function base64Decode(value) {
  let result = 0;
  for (let i in value) {
    if (value.hasOwnProperty(i)) {
      result = result * 64 + base64Digits.indexOf(value[i]);
    }
  }
  return result;
}


/**Given a RIRI2/RIRI3 separated string, parse it into json
* UPDATE: Structure is '\u001E\u0001', but split on u001e (RIRISEP3).
*/
function parseSmMsgs(smMsgs) {

  if (smMsgs) {
    let arr = [];

    if (Array.isArray(smMsgs)) {
      smMsgs.map(msg => arr.push(riStringCheckAndConvert(msg)));
    } else {
      let msgsArray = smMsgs.split(RIRISEP3);
      msgsArray.map(msg => arr.push(riStringCheckAndConvert(msg)));
    }
    return arr;
  } else return;
}

export function convertObjToArrayForPublish(model, obj, clientID, riString, selectedItems, attributes) {

  let objVal = RtCbor.encodeStringString('event'),
    widgetKey = RtCbor.encodeStringString('widget'),
    widgetVal = RtCbor.encodeString(obj.identifier),
    channelKey = RtCbor.encodeString('channel'),
    channelVal = RtCbor.encodeString(clientID),
    selectionKey = RtCbor.encodeString('selection'),
    selectionVal,
    selectorKey = RtCbor.encodeString('selector'),
    selectorVal = RtCbor.encodeString(obj.selector);

  if (riString) {
    let riStringText = riString.text ? riString.text : riString.name; //name exists in TreePane instead of text (needed for react-treebeard)
    if (riString.header) {
      if (riString.tag) selectionVal = RtCbor.encodeString(riString.header + riString.tag + riStringText);
      else selectionVal = RtCbor.encodeString(riString.header + riStringText);
    }
    else selectionVal = RtCbor.encodeString(riStringText);
  }
  else if (Array.isArray(obj.contents)) selectionVal = RtCbor.encodeString(obj.contents[0].text);
  else selectionVal = RtCbor.encodeString(obj.contents.text ? obj.contents.text : obj.contents);

  let selectedItemsBuffer;
  if (selectedItems && selectedItems[model]) {
    let selectedItemsModelEntries = Object.entries(selectedItems[model]);
    for (let i = 0; i < selectedItemsModelEntries.length; i++) {
      let selectionIDKey = RtCbor.encodeString('selection' + selectedItemsModelEntries[i][0]); //0 is key. ex. 'selection15'
      let selectionIDVal;

      let selectedItem = selectedItemsModelEntries[i][1],
        selectedItemText = selectedItem.text ? selectedItem.text : selectedItem.name; //name exists in TreePane instead of text (needed for react-treebeard). Will be undefined if neither exist, which is fine
      if (selectedItemText) {
        if (selectedItem.header) {
          if (selectedItem.tag) {
            selectionIDVal = RtCbor.encodeString(selectedItem.header + selectedItem.tag + selectedItemText);
          }
          else selectionIDVal = RtCbor.encodeString(selectedItem.header + selectedItemText);
        }
        else selectionIDVal = RtCbor.encodeString(selectedItemText);
      }
      else selectionIDVal = RtCbor.encodeString(selectedItem); //if not a riri string

      if (selectedItemsBuffer) selectedItemsBuffer = Buffer.concat([selectedItemsBuffer, selectionIDKey, selectionIDVal]);
      else selectedItemsBuffer = Buffer.concat([selectionIDKey, selectionIDVal]);
    }
  }

  let attributesBuffer;
  if (attributes) {
    let attributesEntries = Object.entries(attributes);
    for (let i = 0; i < attributesEntries.length; i++) {
      if (attributesBuffer) attributesBuffer = Buffer.concat([attributesBuffer, RtCbor.encodeString(attributesEntries[i][0]), RtCbor.encodeString(attributesEntries[i][1])]);
      else attributesBuffer = Buffer.concat([RtCbor.encodeString(attributesEntries[i][0]), RtCbor.encodeString(attributesEntries[i][1])]);
    }
  }

  if (selectedItemsBuffer && attributesBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, selectedItemsBuffer, attributesBuffer, omap_end]);
  else if (selectedItemsBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, selectedItemsBuffer, omap_end]);
  else if (attributesBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, attributesBuffer, omap_end]);
  else return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, omap_end]);

}

export function sendMsg(model, clickedObj, clientID, selectedItems, attributes) {
  const msg = convertObjToArrayForPublish(model, clickedObj, clientID, null, selectedItems, attributes),
    topic = clientID + '/' + cellID + '/' + model + '/action/1';

  if (mqttClient && cellID) {
    console.info("Publishing -\n Topic: " + topic + "\n Message: " + msg);
    let cbormsg = RtCbor.encodeArray(msg); //convert msg to smCbor
    mqttClient.publish(topic, cbormsg);
  }
}