import React, { Component } from 'react';
//import { connect } from 'react-redux';

import MQTT from './mqtt';
import Subscriptions from './subscriptions';
import GridLayoutLayout from './gridLayout';

class Whiteboard extends Component {
  render() {
    return [
      <MQTT key='mqtt' />,
      <Subscriptions key="subscriptions"/>,
      <GridLayoutLayout key="layout"/>
    ];
  }

}

export default (Whiteboard);
