import React, {Component} from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

class Whiteboard extends Component {

  /**Returns the given frameratio string (i.e. '20@100;50@60' or '20;100;50;60')
   * as a json object: { left:20, top:100, right:50, bottom:60 }
   * */
  getFrameRatioFor(val) {
    var frameRatio, doing, p0, ndx, len; //local vars
    frameRatio = {};
    doing=0; //start with 0 (left)
    p0=0; //index of start of substring
    len = val.length;
    for(ndx=0; ndx<len; ndx++) { //walk through the string
      if(val[ndx]===';' || val[ndx]==='@') { //split on separators
        switch(doing) {
          case 0: frameRatio.left  = parseInt(val.substring(p0, ndx), 10); break; //left
          case 1: frameRatio.top   = parseInt(val.substring(p0, ndx), 10); break; //top
          case 2: frameRatio.right = parseInt(val.substring(p0, ndx), 10); break; //right
        }
        p0 = +ndx+1; //next
        doing++; //next
      }
    }
    frameRatio.bottom = parseInt(val.substring(p0, val.length), 10); //bottom
    return frameRatio;
  };




  convertArraytoKeyValues(decodedCbor) {
    var store = {};
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





  render() {
    return null;
  }



function mapStateToProps(state) {
  return {
		whiteboard: state.whiteboard;
  };
}

export default connect(mapStateToProps,{sendAction})(Whiteboard);
