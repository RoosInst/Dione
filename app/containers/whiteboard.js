import React, {Component} from 'react';
import { connect } from 'react-redux';
import { updateWhiteboard } from '../actions';

class Whiteboard extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    // console.log("NextProps: ", nextProps);
    // console.log("NextState: ", nextState);
    // console.log("Whiteboard :", this.props.whiteboard);
    // console.log("Message :", this.props.latestMessage);
    if (nextProps.latestMessage === this.props.latestMessage)
      return false;

    return true;
  }

  componentDidUpdate() {
      this.props.updateWhiteboard(
        this.GetStyleAndCreateHierarchy(
          this.convertArrayToKeyValues(this.props.latestMessage)
        )
      );
  }
  /**Returns the given frameratio string (i.e. '20@100;50@60' or '20;100;50;60')
   * as a json object: { left:20, top:100, right:50, bottom:60 }
   * */
  getFrameRatioFor(val) {
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

  makeStyleFromFrameRatio(val) {
    var frameRatio = this.getFrameRatioFor(val);
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


  GetStyleAndCreateHierarchy(unsortedStore) {
    var forest = {};

    var tree = jQuery.extend({}, unsortedStore.top); //must clone
    var i = 0;
    for (var key in unsortedStore) {
      // skip loop if the property is from prototype
      if (!unsortedStore.hasOwnProperty(key)) continue;
      var obj =unsortedStore[key];

      if (obj.frameRatio) {
        obj.style = this.makeStyleFromFrameRatio(obj.frameRatio);
      }

      if (obj.owner) {
        if (obj.owner == "top") {
          tree[obj.identifier] = obj;
        } else {
          var owner = tree[obj.owner];
          owner[obj.identifier] = obj;
        }
      } else if (!obj.identifier) { //checks not toppane, because toppane has id but not owner
        tree["msg" + i] = obj;
        i++;
      }
    }
    forest[tree.model] = tree;


    if (this.props.whiteboard) {
      var wb = this.props.whiteboard;
      wb[tree.model] = tree;
      return wb;
    }

    return forest;
}

      convertArrayToKeyValues(decodedCbor) {
        if (decodedCbor == null) {
         return;
        }
        var store = {};
        var msgObj = {};
      //Assigns keys and values through arrays passed in decodedCbor

        for (var array = 0; array < decodedCbor.length; array++) {
          for (var i = 1; i < decodedCbor[array].length; i=i+2) {
            //msgObj[decodedCbor[array][1]] = decodedCbor[array][1]; //toppane, subpane, etc.
            msgObj[decodedCbor[array][i]] = decodedCbor[array][i+1];
          }
        //  if (store[decodedCbor[array][1]] != decodedCbor[array][1]) {
        //    store[decodedCbor[array][1]] = msgObj;
        //  }
           //else store[array] =
          store[msgObj.identifier] = msgObj;
          msgObj = {};
          //console.log("Continuing to new array, msgObj so far: ", msgObj);
        }
        return store;
      }


      render() {
        return null;
      }
    }



function mapStateToProps(state) {
  return {
		latestMessage: state.latestMessage,
    whiteboard: state.whiteboard
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
