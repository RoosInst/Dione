/*Here exists non-React functions essential to building the app.*/

export function getFrameRatioFor(val) {
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
export function makeStyleFromFrameRatio(val) {
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
 and creates "style" key with values for positioning for each obj with frameRatio.*/
export function getStyleAndCreateHierarchy(unsortedStore, whiteboard) {
  var forest = {};
  var tree = jQuery.extend({}, unsortedStore.top); //must clone
  var i = 0;
  for (var key in unsortedStore) {
    // skip loop if the property is from prototype
    if (!unsortedStore.hasOwnProperty(key)) continue;
    var obj =unsortedStore[key];
    if (obj.frameRatio) {
      obj.style = makeStyleFromFrameRatio(obj.frameRatio);
    }
    if (obj.owner) {
      if (obj.owner == "top") {
        tree[obj.identifier] = obj;
      } else {
        var owner = tree[obj.owner];
        owner[obj.identifier] = obj;
      }
    } else if (!obj.identifier) { //checks not toppane, because toppane has id but not owner
      tree["_msg" + i] = obj;
      tree["_msg" + i].identifier = "_msg" + i;
      i++;
    }
  }
  if (whiteboard) {
    var wb = jQuery.extend({}, whiteboard);
    wb[tree.model] = tree;
    return wb;
  }
  forest[tree.model] = tree;
  return forest;
}



/*Converts the message of arrays into flat object.*/
export function convertArrayToKeyValues(decodedCbor) {
  if (decodedCbor == null) {
   return;
  }
  var store = {};
  var msgObj = {};
  for (var array = 0; array < decodedCbor.length; array++) {
    for (var i = 1; i < decodedCbor[array].length; i=i+2) {
      msgObj[decodedCbor[array][i]] = decodedCbor[array][i+1];
    }
    store[msgObj.identifier] = msgObj;
    msgObj = {};
  }
  return store;
}
