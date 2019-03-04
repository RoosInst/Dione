import React, {Component} from 'react';
import { connect } from 'react-redux';
import { getRiStringAsLi, convertObjToArrayForPublish, sendMsg } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';
import PropTypes from 'prop-types';

import { mqttClient, cellID } from '../containers/mqtt';

class Pane extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired,
    addSelection: PropTypes.func.isRequired
  }

  handleClick(riString, clickedObj) {

    const { model, clientID, selectedItems, whiteboard, addSelection } = this.props;

    //add to selectedItems only if not the context menu (right-click menu) clicked
    if (!clickedObj.identifier.includes('Menu')) addSelection(model, clickedObj.identifier, riString);

    let attributes;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

    const msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes),
      topic = clientID + '/' + cellID + '/' + model + '/action/1';

    if (mqttClient && cellID) {
      console.info('Publishing -\n Topic: ' + topic + '\n Message: ' +  msg);
      mqttClient.publish(topic, msg);
    }
  }



	render() {
    this.handleClick = this.handleClick.bind(this);
    const {obj, model, clientID, selectedItems } = this.props;

    for (const key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes('Menu')) {
        var menu = key; //var, not let
      }
    }
    if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities


      return (
        <div className='contextMenu'>
           <ContextMenuTrigger id={obj.identifier}>
             <ul>
               {obj.contents && (
                  Array.isArray(obj.contents) ?
                    obj.contents.map((arrayVal, key) => {
                      return arrayVal && (
                        getRiStringAsLi(model, arrayVal, key, obj, clientID, this.handleClick, selectedItems)
                      )
                    })
                  : getRiStringAsLi(model, obj.contents, undefined, obj, clientID, this.handleClick, selectedItems)
                )}
              </ul>
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
               obj[menu].value.map((menuItem, key) => {
                 return menuItem && (
                   <MenuItem key={key} onClick={() => this.handleClick(menuItem, obj[menu])}>
                       {menuItem.text}
                   </MenuItem>
                 );
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
              return (arrayVal && arrayVal.text) && (
                getRiStringAsLi(model, arrayVal, key, obj, clientID, this.handleClick, selectedItems)
              )
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
    selectedItems: state.selectedItems
  };
}

export default connect(mapStateToProps, { addSelection } )(Pane);
