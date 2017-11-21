/*Here exists functions essential to building the app.*/
import React from 'react';
const cbor = require('cbor');
const mqtt = require('mqtt');

function getFrameRatioFor(val) {
  var frameRatio, doing, p0, i, len; //local vars
  frameRatio = {};
  doing=0; //start with 0 (left)
  p0=0; //index of start of substring
  len = val.length;
  for(i=0; i<len; i++) { //walk through the string
    if(val[i]===';' || val[i]==='@') { //split on separators
      switch(doing) {
        case 0: frameRatio.left  = parseInt(val.substring(p0, i), 10); break; //left
        case 1: frameRatio.top   = parseInt(val.substring(p0, i), 10); break; //top
        case 2: frameRatio.right = parseInt(val.substring(p0, i), 10); break; //right
      }
      p0 = +i+1; //next
      doing++; //next
    }
  }
  frameRatio.bottom = parseInt(val.substring(p0, val.length), 10); //bottom
  return frameRatio;
};


/**Returns the given frameratio string (i.e. '20@100;50@60' or '20;100;50;60')
 * as a json object: { left:20, top:100, right:50, bottom:60 }
 * */
function makeStyleFromFrameRatio(val) {
  var frameRatio = getFrameRatioFor(val);
  var wd, ht, xpos, ypos;
  if(frameRatio) { //frameRatio is percent values for: left, right, top, bottom
    wd = (frameRatio.right-frameRatio.left)+'%';
    ht = (frameRatio.top-frameRatio.bottom)+'%';
    xpos = frameRatio.left;
    ypos = 100-frameRatio.top;
  }
  else {
    wd = 'auto';
    ht='auto';
    xpos = 0;
    ypos = 0;
  }
  return ({position: "absolute", left: xpos+"%", top: ypos+"%", width: wd, height: ht});
};



/*unSortedStore is flat obj containing everything after converted from array.
whiteboard is current existing state of all apps in a hierarchical object.
Function nests objects into its owners (makes flat obj into hierarchical)
 and creates "style" key with values for positioning for each obj with frameRatio.
 Also decodes riri strings into array of usable objects.*/
export function getStyleAndCreateHierarchy(unsortedStore, whiteboard, model) {
  var forest = {}; //copy of whiteboard if exists
  var tree = {};
  if (whiteboard) {
    forest = jQuery.extend({}, whiteboard); //deep clone, do not alter redux store (treat as immutable)
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

  var i = 0;
  for (var key in unsortedStore) {
    // skip loop if the property is from prototype
    if (!unsortedStore.hasOwnProperty(key)) continue;

    var obj = unsortedStore[key];

    if (Array.isArray(obj)) {
      insertArray(tree, obj);
    }

    else {

      if (obj.value) { //obj.value always an array
        var arr = [];
        for (var i, j = 0; j < obj.value.length - 1; j++) {
          if (typeof obj.value[j] === 'string' && typeof obj.value[j + 1] === 'string' && obj.value[j].includes('\u0001') && !obj.value[j + 1].includes('\u0001')) { //if array contains pairs
              if (arr.length === 0) console.error('ERR: Both riri and non-riri strings detected in obj.value ', obj.value, 'Detected pairs and combining.'); //only make error message once, so checks arr.length
              arr[i] = obj.value[j] + '=' + obj.value[j+1];
              j++; //increment j twice at end of loop
              i++;
          } else if (typeof obj.value[j] !== 'string') console.error('ERR: Unrecognized obj.value:', obj.value[j]);
            else if (typeof obj.value[j + 1] !== 'string') console.error('ERR: Unrecognized obj.value:', obj.value[j + 1]);
        }
        if (arr.length > 0) {
          for (var i = 0; i < arr.length; i++) {
            var tempArr = parseSmMsgs(arr[i]); //returns array
            arr[i] = tempArr[0]; //because storing each val in an array already, remove inner array by indexing [0]
          }
        }
        else {
          for (var i = 0; i < obj.value.length; i++) {
            if (typeof obj.value[i] === 'string') {
              var tempArr = parseSmMsgs(obj.value[i]); //returns array
              arr[i] = tempArr[0]; //because storing each val in an array already, remove inner array by indexing [0]
            } else {console.error('ERR: Unrecognized obj.value:', obj.value[i])}
          }
        }
        obj.value = arr;
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
        var entries = Object.entries(obj);
        for (var i = 0; i < entries.length; i++) {
            if (entries[i][0] === 'attributes') {
              var attributeEntries = Object.entries(entries[i][1]);
              for (var j = 0; j < attributeEntries.length; j++) {
                tree['attributes'][attributeEntries[j][0]] = attributeEntries[j][1];
              }
            }
            else tree[entries[i][0]] = entries[i][1];
        }
        // tree['_msg' + i] = obj;
        // tree['_msg' + i].identifier = '_msg' + i;
        // i++;
      }
    }
  }
  forest[tree.model] = tree;
  return forest;
}

function insertArray(tree, arr) { //assuming array of objects
  var found = false;
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    recursiveCheck(tree);
  }

  function recursiveCheck(newObj) { //if called again, found = false
    var objVal = obj.value; //owner = object's value in array of objects
    if (newObj[objVal]) {
      newObj[objVal].contents = parseSmMsgs(obj.contents);
      if (obj.highlight) {
        newObj[objVal].contents[i].highlight = obj.highlight;
      }
      found = true;
    }
    else if (!found) { //look for owner (objVal) with recursion
      var tempEntries = Object.entries(newObj);
      for (var i = 0; i < tempEntries.length; i++) {
        if (tempEntries[i][0] !== 'style' && typeof tempEntries[i][1] === 'object' && Object.prototype.toString.call(tempEntries[i][1]) !== '[object Array]') {
         if (newObj[tempEntries[i][0]]) recursiveCheck(newObj[tempEntries[i][0]]);
         if (found) break;
       }
     }
    }
    if (!found) { //if still not found after recursion executed above
      console.error('ERR: Object "' + obj + '"\'s owner "'+ objVal +'" not found!');
      found = true; //set found to true so message doesn't repeat in console
    }
  }
}


function insertObject(tree, obj) {
  var found = false;
  recursiveCheck(tree);

  function recursiveCheck(newObj) { //if called again, found = false
     if (newObj[obj.owner]) {
       var Owner = newObj[obj.owner];
       Owner[obj.identifier] = obj;
       found = true;
     }
     else if (!found) {
       var tempEntries = Object.entries(newObj);
       for (var i = 0; i < tempEntries.length; i++) {
         if (tempEntries[i][0] !== 'style' && typeof tempEntries[i][1] === 'object' && Object.prototype.toString.call(tempEntries[i][1]) !== '[object Array]') {
            //console.log('newObj[tempEntries['+i+'][0]]', newObj[tempEntries[i][0]]);
            if (newObj[tempEntries[i][0]]) recursiveCheck(newObj[tempEntries[i][0]]);
            if (found) break;
        }
      }
    }
    if (!found) { //if still not found after recursion executed above
      console.error('ERR: Object "'+ obj.identifier +'"\'s owner "'+ obj.owner +'" not found!');
      found = true; //set found to true so message doesn't repeat in console
    }
  }
}


/*Converts the message of arrays into flat object. Exception: values is array of objs*/
export function convertArrayToKeyValues(decodedCbor) {
  if (decodedCbor == null) {
   return;
  }
  var store = {};
  var msgObj = {};

  for (var array = 0; array < decodedCbor.length; array++) {

    if (decodedCbor[array][1] === 'contents') {
      msgObj['value'] = decodedCbor[array][0].value;
    };

    for (var i = 1; i < decodedCbor[array].length; i=i+2) {
      if (decodedCbor[array][i] === 'attribute') { //if multiple attributes, make/add to an obj of attributes instead of replacing each attribute w/ latest
        if (!msgObj['attributes']) msgObj['attributes'] = {};
        var splitVal = decodedCbor[array][i+1].split('=');
        msgObj['attributes'][splitVal[0]] = splitVal[1];
      }

      else msgObj[decodedCbor[array][i]] = decodedCbor[array][i+1];
    }

    if (msgObj.identifier) {
      store[msgObj.identifier] = msgObj;
    }

    if (msgObj.contents != null) { //not null, but can be empty string
      if (store['values']) {
      store['values'].push(msgObj);
      } else {
      store['values'] = [msgObj];
      }
    }

    if (decodedCbor[0][0].value === 'top') {
      store['top'] = msgObj;
    }

    if (decodedCbor[0][0].value === 'dialog') { //note: not else if
      if (!store['top']) store['top'] = {}; //want to staticly place dialogs inside top of model (instead of dynamically with assigning an unnecessary owner)
      var temp = store['values']; //will be undefined until it reaches next level of array for dialog
      if(temp) store['top']['dialog'] = temp[0];
    }

    msgObj = {};
  }
  return store;
}



 /**Given a string, checks if the String is a RIRI encoded RiString.
 * If so converts it, otherwise returns the given string unmodified
 * The returned riString object will have the following properties:
 *   text, indent, color, font, tag, action, header
 * All are optional except for 'text'.
 * Note that the values for 'indent', 'color', 'font', and 'tag' are all integers.
 * 'text' and 'action' are strings
 * 'header' is the binary header portion used to emit the riString as RIRI.
 * */
function riStringCheckAndConvert(s) {
    var val, rawHeaderBytes, headerOffset, actionLength;
    var temp, riString, isType2;

    if(!s || s.length===0) { return s; }

    switch(s[0]) {
      case '\u0001': isType2=false; break;
      case '\u0002': isType2=true;  break;
      default:
        var obj = {};
        obj['text'] = s;
        return obj; //is a regular string (neither type 1 or type 2). Return obj with text key's value as string
    }

    rawHeaderBytes=null; //raw bytes extracted from input string
    //var decodedHeader=null; //base 64 decoded header bytes
    headerOffset=5; //location after header, (type1 = 5, type2 = 7)
    actionLength = 0;  //length of the (type 2) action portion

    rawHeaderBytes = s.slice(0, 5); //ignore 1st byte, the next 4 is the type 1 header

    if(isType2) {  //type 2 RiListString
      rawHeaderBytes = rawHeaderBytes+'A'+'A'+s.slice(5, 7); //type 2 header. The two padding bytes allow the 'action' string length to be properly decoded using base 64
      headerOffset = 7; //header offset for type 2 'action' string
    }

    try {
      val = base64Decode(rawHeaderBytes);  //extract the, base 64 encoded, type1 header portion
      //temp = base64Encode(val, 4); //test the reverse action (debug)
      riString = {};

      if(isType2) { //for type 2 decode the 'action' string
        //determine the action command length then extract it
        actionLength = ((rawHeaderBytes[4] & 0xff) << 8) + (rawHeaderBytes[5] & 0xff); //convert to int
        if(headerOffset+actionLength > s.length) { //check that specified action string length is not larger than available bytes.
          console.error('Error parsing RiString (type 2) action cmd because of length: action cmd length='+actionLength+'. Available string length='+(s.length-headerOffset));
          actionLength = 0; //if so then set action string to zero so that bytes show up in the regular string data (to help in debug)
        }
        var tempAction =  s.slice(headerOffset, headerOffset+actionLength);
        if (tempAction) riString.action = tempAction;
      }

      temp = ((val >>> 20) & 0xf); //color: 4 bits
      if(temp!==0) { riString.color  = temp; } //create entry only if actually has a value
      temp = ((val >>> 16) & 0xf); //indent: 4 bits
      if(temp!==0) { riString.indent = temp; }
      temp = ((val >>> 14) & 0x3); //font: 2 bits
      if(temp!==0) { riString.font   = temp; }
      temp = (val & 0x3fff);       //tag: 14 bits
      if(temp!==0) { riString.tag = s.slice(headerOffset + actionLength, headerOffset + actionLength + temp);}

    }
    catch(e) {
      console.error('Unable to convert RiString header because: '+e);
    }

    //take the remainder as the text. For type1 = 5, for type2 = (7+length of action string)

    if (riString.tag) {
      var tempText = s.slice(headerOffset+actionLength + riString.tag.length);  //cut off tag
      if (tempText.length > 0) riString.text = tempText; //if tag != text, set text to tempText
      else {
         riString.text = riString.tag; //else if tag === text, make text = tag
         delete riString.tag;
      }
    }
    else riString.text = s.slice(headerOffset+actionLength);
    riString.header= isType2 ? s.slice(1, 7) : rawHeaderBytes; //the raw header portion

    if (isType2) riString.type = '\u0002';
    else riString.type = '\u0001';

    return riString;
  };



/**Given an RiString returns a fomatted JSX list <li>...</li> element*/
export function getRiStringAsLi(model, riString, key, obj, clientID, handleClick, selectedItems) {
    if (!riString.text) return; //sometimes an empty txt string gets passed, so don't make an empty <li> with it
    var indent, color, font, a; //local vars
    if(!riString.text) { //if no text field then it's not an RiString
      return (<li key={key}>{riString}</li>);
    }
    indent=0;
    color=0;
    font=0;
    if(riString.indent) { indent = riString.indent; }
    if(riString.color) { color = riString.color; }
    if(riString.font) { font = riString.font; }
    // if(color===0 && indent===0 && font===0) {
    //   return (<li key={key}>{riString.text}</li>); //nothing to format
    // }


    let riStringContent;
    if (riString.text) {
      if (riString.header) {
        if (riString.tag) {
          if (riString.type) riStringContent = riString.type + riString.header + riString.tag + riString.text;
          else riStringContent = riString.header + riString.tag + riString.text;
        } else riStringContent = riString.header + riString.text
      } else riStringContent = riString.text;
    } else riStringContent = riString;

    let selectedItemContent = null;
    if (selectedItems && selectedItems[model] && selectedItems[model][obj.identifier] && selectedItems[model][obj.identifier]) {
      selectedItemContent = selectedItems[model][obj.identifier];
      if (selectedItemContent.text) {
        if (selectedItemContent.header) {
          if (selectedItemContent.tag) {
            if (selectedItemContent.type) selectedItemContent = selectedItemContent.type + selectedItemContent.header + selectedItemContent.tag + selectedItemContent.text;
            else selectedItemContent = selectedItemContent.header + selectedItemContent.tag + selectedItemContent.text;
          } else selectedItemContent = selectedItemContent.header + selectedItemContent.text
        } else selectedItemContent = selectedItemContent.text;
      }
    }
    console.log('selectedItems[model][obj.identifier]:', selectedItems[model][obj.identifier]);
    console.log('riStringContent:', riStringContent);
    return (
      <li onClick={() => handleClick(riString, obj)}
         key={key}
         className={`${color !==0 ? 'rsColor '+color : ''}${font !== 0 ? 'rsStyle '+font : '' }${selectedItemContent === riStringContent ? 'active' : ''}`}>
        {nbspaces(indent)}
        {riString.text}
      </li>
    );
  };



  /**Returns a string with the indicated number of spaces*/
  function nbspaces(len) {
    var i, a, len10; //local vars

    if(len<=0) { return ''; }
    switch(len) {
      case  1: return '&nbsp '; case 10: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp '; //note: added an extra regular space because it helps the old firefox browser
      case  2: return '&nbsp&nbsp '; case  9: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  3: return '&nbsp&nbsp&nbsp '; case  8: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  4: return '&nbsp&nbsp&nbsp&nbsp '; case  7: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
      case  5: return '&nbsp&nbsp&nbsp&nbsp&nbsp '; case  6: return '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp ';
    }
    a='';
    len10 = Math.floor(len/10);
    for(i=0; i<len10; i++) { a+='&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'; } //the big chunks
    return a+nbspaces(len-(len10*10))+' '; //the remainder.  note: added an extra regular space because it helps the old firefox browser
  };



/**Base64 decode: Converts to integer from base 64 string (or array).
 * Note: this one derived from the smalltalk method 'riBase64Integer'
 */
var base64Digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";  //used for base64 encode/decode

function base64Decode(value) {
    var ndx;
    var result = 0;
    for(ndx in value) {
      if(value.hasOwnProperty(ndx)) {
        result = result * 64 + base64Digits.indexOf(value[ndx]);
      }
    }
    return result;
};




//RIRI Separators:
var
RIRISEP1 = '\u001c', //RIRI level 1 separator - FS - '^'
RIRISEP2 = '\u001d', //RIRI level 2 separator - GS - '+'
RIRISEP3 = '\u001e', //RIRI level 3 separator - RS - '~'
RIRISEP4 = '\u001f', //RIRI level 4 separator - US - '/'riStringCheckAndConvert
RIRISEP = [RIRISEP1, RIRISEP2, RIRISEP3, RIRISEP4] //for array access of RIRI separators
;

/**Given a RIRI2/RIRI3 separated string, parse it into json
* UPDATE: Structure is '\u001E\u0001', but split on u001e (RIRISEP3).
          First message missing RIRISEP3 in front of it, so add it.
*/
function parseSmMsgs(smMsgs) {
  if (smMsgs) {
    var arr = [];
    var obj = {};
    if (Array.isArray(smMsgs)) {
      smMsgs.map(msg => {
        if (msg) arr.push(parseSingleSmMsg(msg));
      });
    } else {
      arr.push(parseSingleSmMsg(smMsgs));
    }
    return arr;
  } else return;
}

function parseSingleSmMsg(smMsg) { //returns obj
  if (!smMsg) return;
   if (!smMsg.includes('\u0001') && !smMsg.includes('\u0002')) { //if no riri inside string
    var obj = {};
    obj['text'] = smMsg;
    return obj;
  }
  var s, ndx, b, item0, p, key;
  var val0, entry, len;
  smMsg = RIRISEP3 + smMsg; //initial one doesn't have RIRISEP3 on it
  var a = smMsg.split(RIRISEP3); //split on RIRISEP3 (previously on second level riri separator, check UPDATE comments above).
  if(!a[0] || a[0].length===0) {a.shift();} //remove the first element if empty (implies a leading sep, which gets tossed)
  len = a.length;
  for(ndx=0; ndx<len; ndx++) {
    if(a[ndx].indexOf(RIRISEP3) < 0) { //if no 3rd level seps it just goes in directly
      return riStringCheckAndConvert(a[ndx]); //convert to riString if needed
    }
    else { //may have a sep after the equals: "key=SEP val1 SEP val2..." -or- may not: "key=val1 SEP val2..."
      b = a[ndx].split(RIRISEP3); //sep by level 3
      if(b.length===0) { continue; } //is this check useful?
      item0 = b[0];
      p=item0.indexOf('='); //check the first entry for an assignment operator, e.g. "contents=..."
      if(p<0) {p=item0.indexOf(':'); } //assignment used in turtle graphics

      if(p>=0) { //if 1st item has assignment: split it int key and value portions: key=val1, val2, val3 --> {key:[val1, val2, val3]
        key=item0.substring(0, p); //extract the 'key' portion
        if(p+1 < b.length) { //if there was anything after the equals that means there was no leading separator before the first value: key=val SEP val...
          val0 = item0.substring(p+1);
          b[0] = val0; //replace first entry with the cleaned up one ('key=' removed)
        }
        else { //first entry had nothing after the equals so just remove it
          b.shift(); //remove first entry from array
        }

        var len2 = b.length;
        for(var ndx2=0; ndx2<len2; ndx2++) { //check for any riString entries
          b[ndx2] = riStringCheckAndConvert(b[ndx2]); //convert to riString if needed
        }
        entry = {};
        entry[key] = b;
        return entry;
      }
      else return b; //no assignment on the first entry so just it take as an array
    }
  }
};



var omap_start = Buffer.from('9f', 'hex'); // hex x9F, cbor start byte for unbounded arrays
var omap_cborTag = Buffer.from('d3', 'hex'); // hex xD3, start object map (omap cbor tag)
var omap_end = Buffer.from('ff', 'hex'); // hex xFF, cbor end byte for unbounded arrays
var cbor_null = Buffer.from('f6', 'hex'); // hex 0xF6, null (string==null, aka empty omap)

export function convertObjToArrayForPublish(model, obj, clientID, riString, selectedItems, attributes) {
  var objVal = cbor.encode('event');
  var widgetKey = cbor.encode('widget');
  var widgetVal = cbor.encode(obj.identifier);
  var channelKey = cbor.encode('channel');
  var channelVal = cbor.encode(clientID);
  var selectionKey = cbor.encode('selection');

  var selectionVal;
  if (riString) {
    if (riString.header) {
      if (riString.tag) selectionVal = cbor.encode(riString.header + riString.tag + riString.text);
      else selectionVal = cbor.encode(riString.header + riString.text);
    }
    else selectionVal = cbor.encode(riString.text);
  }
  else if (Array.isArray(obj.contents)) selectionVal = cbor.encode(obj.contents[0].text);
  else selectionVal = cbor.encode(obj.contents);

  var selectorKey = cbor.encode('selector');
  var selectorVal = cbor.encode(obj.selector);

  var selectedItemsBuffer = null;
  if (selectedItems && selectedItems[model]) {
    var selectedItemsModelEntries = Object.entries(selectedItems[model]);
    for (var i = 0; i < selectedItemsModelEntries.length; i++) {
      var selectionIDKey = cbor.encode('selection' + selectedItemsModelEntries[i][0]); //0 is key. ex. 'selection15'
      var selectionIDVal;

      let selectedItem = selectedItemsModelEntries[i][1];
      if (selectedItem.text) {
        if (selectedItem.header) {
          if (selectedItem.tag) {
            if (selectedItem.type) selectionIDVal = cbor.encode(selectedItem.type + selectedItem.header + selectedItem.tag + selectedItem.text);
            else selectionIDVal = cbor.encode(selectedItem.header + selectedItem.tag + selectedItem.text);
          }
          else selectionIDVal = cbor.encode(selectedItem.header + selectedItem.text);
        }
        else selectionIDVal = cbor.encode(selectedItem.text);
      }
      else selectionIDVal = cbor.encode(selectedItem); //if not a riri string

      if (selectedItemsBuffer) selectedItemsBuffer = Buffer.concat([selectedItemsBuffer, selectionIDKey, selectionIDVal]);
      else selectedItemsBuffer = Buffer.concat([selectionIDKey, selectionIDVal]);
    }
  }

  var attributesBuffer = null;
  if (attributes) {
    var attributesEntries = Object.entries(attributes);
    for (var i = 0; i < attributesEntries.length; i++) {
      if (attributesBuffer) attributesBuffer = Buffer.concat([attributesBuffer, cbor.encode(attributesEntries[i][0]), cbor.encode(attributesEntries[i][1])]);
      else attributesBuffer = Buffer.concat([cbor.encode(attributesEntries[i][0]), cbor.encode(attributesEntries[i][1])]);
    }
  }

  if (selectedItemsBuffer && attributesBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, selectedItemsBuffer, attributesBuffer, omap_end]);
  else if (selectedItemsBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, selectedItemsBuffer, omap_end]);
  else if (attributesBuffer) return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, attributesBuffer, omap_end]);
  else return Buffer.concat([omap_start, omap_cborTag, objVal, widgetKey, widgetVal, channelKey, channelVal, selectionKey, selectionVal, selectorKey, selectorVal, omap_end]);

}


export function getTreeFor(/*riString[]*/ rsArray) {
  var len, rootNode, parent, currentParentNode, currentChildNode, currentChildIndent, i, r,
      indent, newIndent; //local var defs

  if(!rsArray) { return null; } //nothing to do
  len = rsArray.length;
  if(len<1) { return null; } //nothing to do

  rootNode = { //the returned value
    identifier: 'index',
    label: 'text',
    items: rsArray //the list of all the entries, irrespective of parentage. To these are added references to the index of children and parents
  };

  currentParentNode = null; //the current node to which children are being added
  currentChildNode = null; //most recently added child

  r = rsArray[0]; //riString
  if(r.text===undefined) { //if is a regular string, need to replace it with an riString (for tree purposes)
    r = {};
    r.text = rsArray[0];
    rsArray[0] = r; //replace it
  }
  currentChildIndent = (r.indent===undefined) ? 0 : r.indent; //the indent value of the most recent node added. Start it at the value of the first node.

  for(i=0; i<len; i++) { //to each entry, add references for children and parent

    r = rsArray[i]; //riString
    if(r.text===undefined) { //if is a regular string, need to replace it with an riString (for tree purposes)
      r = {};
      r.text = rsArray[i];
      rsArray[i] = r; //replace it
    }

    r.index = i; //give a unique, sequential index to each entry
    r._reference = i; //amazingly: this was the final thing needed to make it work
    if(r.indent===undefined) { r.indent = 0; } //ensure have an indent because is used for tree display
    indent = r.indent;

    if(indent===currentChildIndent) { //keep pushing into same parent node
      currentChildNode = r; //create new node
      r.parent = currentParentNode;
      if(currentParentNode) { //if have a parent
        if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
        currentParentNode.kids.push(currentChildNode);
      }
    }

    else if(indent > currentChildIndent) { //push into the most recent child
      currentParentNode = currentChildNode; //push down one
      currentChildNode = r; //create new node
      r.parent = currentParentNode;
      if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
      currentParentNode.kids.push(currentChildNode);
      currentChildIndent = indent;
    }

    else { //i.e. indent < currentLevel: pop until find a node above the level of this node
      parent = currentParentNode;
      while(true) {
        if(!parent) { //just in case something goes horribly wrong
          parent = rootNode;
          break; //all done
        }
        if(!parent) { newIndent=0; }
        else { newIndent = parent.indent; }
        if(newIndent < indent) { //find a node at a level at least 1 smaller than this node
          break; //all done
      }
        currentParentNode = parent;
        parent = currentParentNode.parent;
      }
      currentParentNode = parent;
      currentChildNode = r; //create new node
      r.parent = currentParentNode;
      if(currentParentNode.kids===undefined) { currentParentNode.kids = []; } //ensure parent has a kids entry if about to push on a kid
      currentParentNode.kids.push(currentChildNode);
      currentChildIndent=indent;
    }
  }
  return rootNode;
};
