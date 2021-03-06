import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { addSelection } from '../actions';
import eol from 'eol'; //some line endings inconsistent (CR with CRLF)
import PropTypes from 'prop-types';

import { mqttClient, cellID } from '../containers/mqtt';

class Pane extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired
  }

  handleClick(riString, clickedObj) {

    const { model, clientID, selectedItems, whiteboard } = this.props;

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
    const { obj } = this.props;

    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }
     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>

                {obj.contents && obj.contents[0] ?
                   Array.isArray(obj.contents) && obj.contents[0].highlight ? //if highlight exists, then assuming array will only be length 1 (contents[0]). contents[0] sometimes undefined, so check
                    <pre>
                      {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
                      <span className='highlight'>
                        {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
                      </span>
                      {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
                    </pre>
                  : //no highlight
                    <pre>{eol.lf(obj.contents[0].text)}</pre>
                : <span style={{whiteSpace: 'pre'}} />
                //ContextMenuTrigger needs child, so render empty span
              }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
               obj[menu].value.map((menuItem, key) => {
                 if (menuItem) {
                 return(
                   <MenuItem key={key} onClick={() => this.handleClick(menuItem, obj[menu])}>
                       {menuItem.text}
                   </MenuItem>
                 );
               } else return
             })
            }
          </ContextMenu>
         </div>
       );
     }
     else if (obj.contents) {
       return (<span style={{whiteSpace: 'pre'}}>{eol.lf(obj.contents[0].text)}</span>);
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
