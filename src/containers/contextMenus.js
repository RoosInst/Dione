import React, { Component } from 'react'
import { connect } from 'react-redux';

//import { mqttClient, cellID } from '../containers/mqtt';

import { updateMousePosition } from '../actions';

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export class ContextMenus extends Component {

    handleClick() { 
        //************************************
        //THIS IS BROKEN, NEEDS TO BE FIXED
        //************************************
        //riString, clickedObj
        // const { model, clientID, selectedItems, whiteboard } = this.props;

        // let attributes;
        // if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

        // const msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes),
        //     topic = clientID + '/' + cellID + '/' + model + '/action/1';

        // if (mqttClient && cellID) {
        //     console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
        //     mqttClient.publish(topic, msg);
        // }
        console.info('inside the menu');
    }

    handleClose(updateMousePosition) {
        updateMousePosition(null, null, null);
    }

    render() {
        const { fullMenu, mousePosition, identifier} = this.props;
        return (
            <Menu
            keepMounted
            open={mousePosition.y != null && mousePosition.identifier == identifier}
            onClose={() => this.handleClose(this.props.updateMousePosition)}
            anchorReference="anchorPosition"
            anchorPosition={ mousePosition.y !== null && mousePosition.x !== null
                             ? { top: mousePosition.y, left: mousePosition.x }
                             : undefined }
            >
                {fullMenu.value.map((menuItem, key) => {
                   return <MenuItem key={key} onClick={() => this.handleClick(menuItem, fullMenu)}>{menuItem.text}</MenuItem>
                })}
            </Menu>
        )
    }
}

function mapStateToProps(state) {
    return {
        clientID: state.clientID,
		whiteboard: state.whiteboard,
        selectedItems: state.selectedItems,
        mousePosition: state.mousePosition
    };
  }
  
export default connect(mapStateToProps, { updateMousePosition })(ContextMenus);
