import React, {Component} from 'react';
import { connect } from 'react-redux';
import { getRiStringAsLi, convertObjToArrayForPublish } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';

import {mqttClient, cellID} from '../containers/mqtt';
const cbor = require('cbor');

class Pane extends Component {

  handleClick(riString, clickedObj) {
    if (riString.text === 'Copy') {
      document.execCommand("copy");
      return;
    }
    const model = this.props.model;
    const clientID = this.props.clientID;
    const selectedItems = this.props.selectedItems;

    if (clickedObj.identifier.indexOf("Menu") < 0) { //don't add to selectedItems if context menu (right-click menu) clicked
      this.props.addSelection(model, clickedObj.identifier, riString);
    }

    var msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems);
    var topic = clientID + '/' + cellID + '/' + model + '/action/1';
    if (mqttClient && cellID) {
        console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

	render() {
    this.handleClick = this.handleClick.bind(this);
    const obj = this.props.obj;
    const model = this.props.model;

    var menu = null;

    for (var key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.indexOf("Menu") >= 0) {
        menu = key;
      }
    }
     if (obj[menu] && obj.identifier && obj[menu].value) { //if right-clicking capabilities
       var key1 = 0;
       var key2 = 0;
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
             {obj.contents ?
               obj.contents[0].header ? //if header, then render as list. If not, render as normal string
                 <ul>
                   {
                   obj.contents.map((arrayVal) => {
                     key1++;
                     return(getRiStringAsLi(model, arrayVal, key1, obj, this.props.clientID, this.handleClick, this.props.selectedItems));
                   })
                 }
                 </ul>
               :
                 obj.contents && obj.contents[0].highlight ? //if highlight exists, then array will only be length 1 (contents[0])
                     <span style={{whiteSpace: 'pre'}}>
                       {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
                       <span className='highlight'>
                         {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
                       </span>
                         {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
                   </span>
                 :
                   <span style={{whiteSpace: 'pre'}}>{obj.contents[0].text}</span>
              : ''
             }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
             obj[menu].value.map((menuItem) => {
               if (menuItem) {
               key2++;
               return(
                 <MenuItem key={'menuItem' + key2} onClick={() => this.handleClick(menuItem[0], obj[menu])}>
                     {menuItem[0].text}
                 </MenuItem>
               );
             } else return null;
            })
             }
           </ContextMenu>
         </div>
       );
     }
     else if (obj.contents && obj.class === 'ListPane') {
       var i = 0;
       return (<ul>
         {
          obj.contents.map((arrayVal) => {
            i++;
            return(getRiStringAsLi(model, arrayVal, i, obj, clientID));
          })
       }
       </ul>);
     } else if (obj.contents) { //not a ListPane, don't render in a list
       return (<span style={{whiteSpace: 'pre'}}>{obj.contents[0].text}</span>);
     }
     else return null;
		}
	}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
		whiteboard: state.whiteboard,
	  mqttConnection: state.mqttConnection,
    selectedItems: state.selectedItems
  };
}

export default connect(mapStateToProps, { addSelection } )(Pane);
