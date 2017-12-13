import React, {Component} from 'react';
import { connect } from 'react-redux';
import { getRiStringAsLi, convertObjToArrayForPublish } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';
import eol from 'eol'; //some line endings inconsistent (CR with CRLF)

import { mqttClient, cellID } from '../containers/mqtt';
const cbor = require('cbor');

class Pane extends Component {

  handleClick(riString, clickedObj) {
    // if (riString.text === 'Copy') {
    //   document.execCommand("copy");
    //   return;
    // }
    const { model, clientID, selectedItems, whiteboard } = this.props;

    //add to selectedItems only if not the context menu (right-click menu) clicked
    if (!clickedObj.identifier.includes("Menu")) this.props.addSelection(model, clickedObj.identifier, riString);

    let attributes;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

    const msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes),
      topic = clientID + '/' + cellID + '/' + model + '/action/1';

    if (mqttClient && cellID) {
      console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

	render() {
    this.handleClick = this.handleClick.bind(this);
    const {obj, model, clientID, selectedItems } = this.props;

    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }
     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
                 {obj.contents ?
                      <ul>
                      {
                        Array.isArray(obj.contents) ?
                          obj.contents.map((arrayVal, key) => {
                            if (!arrayVal) return;
                            return(getRiStringAsLi(model, arrayVal, key, obj, clientID, this.handleClick, selectedItems));
                          })
                        : getRiStringAsLi(model, obj.contents, key, obj, clientID, this.handleClick, selectedItems)
                      }
                    </ul>
                : '' // no contents
             }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
               obj[menu].value.map((menuItem, key) => {
                 if (menuItem) {
                 return (
                   <MenuItem key={key} onClick={() => this.handleClick(menuItem, obj[menu])}>
                       {menuItem.text}
                   </MenuItem>
                 );
               } else return;
              })
            }
          </ContextMenu>
         </div>
       );
     }
     else if (obj.contents) {
       return (
        <ul>
          {
            obj.contents.map((arrayVal, key) => {
              if (arrayVal && arrayVal.text) return(getRiStringAsLi(model, arrayVal, key, obj, clientID, this.handleClick, selectedItems));
              else return null;
            })
          }
        </ul>
      );
    }
     else return null; //else no obj.contents
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
