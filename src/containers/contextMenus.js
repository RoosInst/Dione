import React, { Component } from 'react'
import { connect } from 'react-redux';

//import { mqttClient, cellID } from '../containers/mqtt';

import { hideContextMenu } from '../actions/mouseInfo';

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

    handleClose() {
        this.props.hideContextMenu();
    }
    //NEED TO SEE WHERE I ADDED MOUSEPOSITION.IDENTIFIER
    render() {
        const { fullMenu, mouseY, mouseX, applicationMouseIsOver, identifier} = this.props;
        return (
            <Menu
            keepMounted
            open={mouseY != null && applicationMouseIsOver == identifier}
            onClose={() => this.handleClose()}
            anchorReference="anchorPosition"
            anchorPosition={ mouseY !== null && mouseX !== null
                             ? { top: mouseY, left: mouseX }
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
        mouseX: state.mouseInfo.mousePosition.x,
        mouseY: state.mouseInfo.mousePosition.y,
        applicationMouseIsOver: state.mouseInfo.applicationMouseIsOver
    };
  }
  
export default connect(mapStateToProps, { hideContextMenu })(ContextMenus);
