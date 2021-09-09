/*
********************************************************************************





OLD COMPONENT THAT CONTAINS INFORMATION ON HOW TO LAUNCH
WIDGETS WITHOUT USING JAVA GUI






********************************************************************************
*/







import React, { Component } from 'react';
import { connect } from 'react-redux';
import { publishArray } from '../scripts/functions';
import { updateWhiteboard, updateWhiteboardLayout, updateWhiteboardTabs, updateMousePressed } from '../actions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

export class ApplicationsTab extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        }
    }

    onLaunchSelectionMouseDown(application, messages) {
        let message = messages[application];
        let topic = 'X016OK8G:T0GC7RQT/X016OK8G/guiLauncher/app/13';
        publishArray(topic, message);
        this.handleClose();
    }

    onLaunchSelectionClick(updateMousePressed) {
        updateMousePressed(true);
    }

    onTabClick(model) {
        console.info(model);
        const {whiteboard, whiteboardTabs, updateWhiteboard, updateWhiteboardTabs } = this.props
        let forest = $.extend({}, whiteboard);
        forest[model] = whiteboardTabs[model];
        updateWhiteboardTabs(model, {});
        updateWhiteboard(forest, model)
    }

    handleClick() {
        console.info('in handleClick')
        this.setState(() => {
            return {
                isOpen: true
            }
        })
    }

    handleClose() {
        this.setState(() => {
            return {
                isOpen: false
            }
        })
    }

    render() {  
        let msgArray = {msgTool:['runLocal', 'className', 'rtalk.tools.RtalkMessageSenderTool']};
        let launchOptions = ['msgTool'];
        const { whiteboardTabs, updateMousePressed } = this.props;
        let tabbedApplications = Object.keys(whiteboardTabs);

        
        return (
            <div style={{paddingBottom:'5px'}} className='applicationsTab'>
                <button style={{cursor: 'pointer'}} className='float-left' id="buttonForMenu" aria-controls="simple-menu" aria-haspopup="true" onClick={() => this.handleClick()}>APPLICATIONS</button>
                <Menu
                    id='simple-menu'
                    anchorEl={document.getElementById('buttonForMenu')}
                    keepMounted
                    open={this.state.isOpen}
                    onClose={() => this.handleClose()}
                >
                    {launchOptions.map(application => {
                        return (
                            <MenuItem id={application} key={application + 'asdkfh'} draggable={true} onMouseDown={() => this.onLaunchSelectionMouseDown(application, msgArray)} onClick={() => this.onLaunchSelectionClick(updateMousePressed)}>
                                {application}
                            </MenuItem>   
                        )
                    })}
                </Menu>
                {tabbedApplications && (
                    tabbedApplications.map(element => {
                        return <div style={{marginLeft:'12px', border: '1px solid black', cursor: 'pointer'}} className="float-left" key="element" onClick={() => this.onTabClick(element)}>{element}</div>
                    })
                )}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return { 
        currentChannel: state.currentChannel,
        whiteboardTabs: state.whiteboardTabs
    }
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout, updateWhiteboardTabs, updateMousePressed })(ApplicationsTab);
