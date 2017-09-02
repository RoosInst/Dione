import React, {Component} from 'react';
import { connect } from 'react-redux';
import { getRiStringAsLi, convertObjToArrayForPublish } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';

import {mqttClient, cellID} from '../containers/mqtt';
const cbor = require('cbor');

class Pane extends Component {

  handleClick(riString) {
    const obj = this.props.obj;
    const model = this.props.model;
    const clientID = this.props.clientID;

    this.props.addSelection(model, obj.identifier, riString);
    //console.log('model', model, '\nobj', obj, '\nclientID', clientID, '\nriString', riString);
    $('.card-block #' + (model + '_' + obj.identifier) + ' li.active').removeClass('active');
    var arr = Object.values(obj.contents);
    var numLi = null;
    for (var i = 0; i < arr.length; i++) { //find which <li> should be active
      if (arr[i] === riString) {
        numLi = i;
        break;
      }
    }
    $('.card-block #' + (model + '_' + obj.identifier) + ' li:eq(' + (numLi) + ')').addClass('active');
    var msg = convertObjToArrayForPublish(model, obj, clientID, riString);
    var topic = clientID + '/' + cellID + '/' + model + '/action/1';
    if (mqttClient && cellID) {
        console.log("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

	render() {
    this.handleClick = this.handleClick.bind(this);
    const obj = this.props.obj;
    const model = this.props.model;

    var menu = null;

    for (var key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu
      if (key.indexOf("Menu") >= 0) {
        menu = key;
      }
    }
     if (obj[menu] && obj.identifier && obj[menu].value) {
       var i = 0;
       var j = 0;
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
             {
               obj.contents && Array.isArray(obj.contents) ?
                 <ul>
                   {
                   obj.contents.map((arrayVal) => {
                     i++;
                     return(getRiStringAsLi(model, arrayVal, i, obj, this.props.clientID, this.handleClick));
                   })
                 }
                 </ul>
               :
                 obj.highlight ?
                     <span style={{whiteSpace: 'pre'}}>
                       {obj.contents.substring(0, obj.highlight[0] - 1)}
                       <span className='highlight'>
                         {obj.contents.substring(obj.highlight[0] - 1, obj.highlight[1] - 1)}
                       </span>
                         {obj.contents.substring(obj.highlight[1] - 1)}
                   </span>
                 :
                   <span style={{whiteSpace: 'pre'}}>{obj.contents}</span>
             }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
             obj[menu].value.map((menuItem) => {
               j++;
               return(
                 <MenuItem key={'menuItem' + j} onClick={() => this.handleClick(model, obj.menuItem, this.props.clientID, menuItem[0])}>
                     {menuItem[0].text}
                 </MenuItem>
               );
             })
             }
           </ContextMenu>
         </div>
       );
     }
     else if (obj.contents) {
       var i = 0;
       return (<ul>
         {
           obj.contents.map((arrayVal) => {
           i++;
           return(getRiStringAsLi(model, arrayVal, i, obj, clientID));
         })
       }
       </ul>);
     } else return null;
		}
	}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
		whiteboard: state.whiteboard,
	  mqttConnection: state.mqttConnection
  };
}

export default connect(mapStateToProps, { addSelection } )(Pane);
