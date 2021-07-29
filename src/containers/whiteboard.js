import React, { Component } from 'react';
import { connect } from 'react-redux';

import MQTT from './mqtt';
import Subscriptions from './subscriptions';
import GridLayoutLayout from './gridLayout';
import ApplicationsTab from './applicationsTab';
import { updateWhiteboard, updateWhiteboardLayout, updateMousePressed } from '../actions';
import { publishArray } from '../scripts/functions';

import { mqttClient } from './mqtt';

const RtCbor = require('../scripts/RtCbor');
import cbor from 'cbor';
let rtCbor = new RtCbor();

class Whiteboard extends Component {

  componentCleanup(whiteboard) {
    console.info("*****************************ß")
   

    let keys = Object.keys(whiteboard);
    console.info(keys);
    keys.forEach(() => {
      console.info('------------------------------')
      rtCbor.encodeArrayNew([null]);
      let topic = 'X016OK8G:RET235R/X016OK8G/msgTool/unsubscribe/4'
      mqttClient.publish(topic, rtCbor.buffers[0]);
      console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) );
    });
  }

  componentDidMount() {
    try {
      const whiteboard = localStorage.getItem('whiteboard');
      const whiteboardLayout = localStorage.getItem('whiteboardLayout');
      const whiteboardObject = JSON.parse(whiteboard);
      const whiteboardLayoutObject = JSON.parse(whiteboardLayout);

      console.info('layout from last session: ', whiteboardLayoutObject);
      const { updateWhiteboardLayout } = this.props;


      window.addEventListener('beforeunload', this.componentCleanup);
      
      let keys = Object.keys(whiteboardObject);
      if(keys.length != 0) {
        let msgArray = {msgTool:['runLocal', 'className', 'rtalk.tools.RtalkMessageSenderTool']};
        let message = msgArray[keys[0]];
        let topic = 'X016OK8G:T0GC7RQT/X016OK8G/guiLauncher/app/13';
        publishArray(topic, message);
        this.props.updateMousePressed(true);
        //updateWhiteboard(whiteboardObject, "");
      }
      console.info(whiteboardLayoutObject);
      if(whiteboardLayoutObject != null) {
        updateWhiteboardLayout(whiteboardLayoutObject, false, "");
      }

      console.info('mounted first time')
    } catch(error) {
      //Do nothing at all
    }
  }

  componentDidUpdate() {
    const { whiteboard } = this.props;
    console.info('in component did update:', whiteboard)
    const json = JSON.stringify(whiteboard);
    localStorage.setItem('whiteboard', json);
  }

  componentWillUnmount() {
    this.componentCleanup(this.props.whiteboard);
    window.removeEventListener('beforeunload', () => this.componentCleanup());
  }

  render() {
    console.info('updating main whiteboard component')
    return [
      <MQTT key='mqtt' />,
      <Subscriptions key="subscriptions"/>,
      <ApplicationsTab key="applications"/>,
      <GridLayoutLayout key="layout"/>
    ];
  }

}

function mapStateToProps(state) {
  return { 
      whiteboard: state.whiteboard,
  }
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout, updateMousePressed })(Whiteboard);
