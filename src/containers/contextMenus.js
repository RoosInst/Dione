import React, { Component } from 'react'
import { connect } from 'react-redux';

//import { mqttClient, cellID } from '../containers/mqtt';

import { hideContextMenu } from '../actions/mouseInfo';
import { sendMsg } from '../scripts/functions';

import RtCbor from '../scripts/RtCbor';
let rtCbor = new RtCbor();

import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export class ContextMenus extends Component {

    handleClick(riString, fullMenu, model, channel, cellId) { 
        let attributes;
        if (fullMenu.attributes) {
            attributes = fullMenu.attributes;
        } 
        //const msg = convertObjToArrayForPublish(model, menuObj, channel, riString, riString, attributes);
        //console.info(rtCbor.decodeAll(msg));
        
        sendMsg(model, fullMenu, cellId, channel, riString, riString, attributes);
        rtCbor.clearTemp();

    }

    handleClose() {
        this.props.hideContextMenu();
    }
    //NEED TO SEE WHERE I ADDED MOUSEPOSITION.IDENTIFIER
    render() {
        const { fullMenu, mouseY, mouseX, applicationMouseIsOver, identifier, channel, cellId, model } = this.props;
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
                   return <MenuItem key={key} onClick={() => this.handleClick(menuItem, fullMenu, model, channel, cellId)}>{menuItem.text}</MenuItem>
                })}
            </Menu>
        )
    }
}

function mapStateToProps(state, ownProps) {
    const { model } = ownProps;

    return {
        mouseX: state.mouseInfo.mousePosition.x,
        mouseY: state.mouseInfo.mousePosition.y,
        applicationMouseIsOver: state.mouseInfo.applicationMouseIsOver,
        channel: state.connectionInfo.whiteboardChannels[model],
        cellId: state.connectionInfo.cellId
    };
  }
  
export default connect(mapStateToProps, { hideContextMenu })(ContextMenus);
