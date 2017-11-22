import React, {Component} from 'react';
import { connect } from 'react-redux';
import { getRiStringAsLi, convertObjToArrayForPublish } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';

import { mqttClient, cellID } from '../containers/mqtt';
const cbor = require('cbor');

class Pane extends Component {

  handleClick(riString, clickedObj) {
    // if (riString.text === 'Copy') {
    //   document.execCommand("copy");
    //   return;
    // }
    const { model, clientID, selectedItems, whiteboard } = this.props;
    if (!clickedObj.identifier.includes("Menu")) { //don't add to selectedItems if context menu (right-click menu) clicked
      this.props.addSelection(model, clickedObj.identifier, riString);
    }
    var attributes = null;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;
    var msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes);
    var topic = clientID + '/' + cellID + '/' + model + '/action/1';
    if (mqttClient && cellID) {
        console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

	render() {
    this.handleClick = this.handleClick.bind(this);
    const {obj, model, clientID, selectedItems } = this.props;
    var menu = null;

    for (var key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        menu = key;
      }
    }
     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
                 {obj.contents ?
                   Array.isArray(obj.contents) && obj.contents[0] && obj.contents[0].highlight ? //if highlight exists, then assuming array will only be length 1 (contents[0]). contents[0] sometimes undefined, so check
                    <span style={{whiteSpace: 'pre'}}>
                      {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
                      <span className='highlight'>
                        {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
                      </span>
                      {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
                    </span>
                    : //no highlight
                  obj.class === 'ListPane' ?
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
                  : //if not listpane, display as text
                    Array.isArray(obj.contents) && obj.contents[0] ?
                    <span style={{whiteSpace: 'pre'}}>{obj.contents[0].text}</span>
                    : <span style={{whiteSpace: 'pre'}}>{obj.contents.text}</span>
                : '' // no contents
             }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
             obj[menu].value.map((menuItem, key) => {
               if (menuItem) { //if not null
               return(
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
     else if (obj.contents && obj.class === 'ListPane') {
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
    } else if (obj.contents) { //not a ListPane, don't render in a list
       return (<span style={{whiteSpace: 'pre'}}>{obj.contents[0].text}</span>);
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
