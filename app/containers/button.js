import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';
import { addSelection } from '../actions';

const cbor = require('cbor');
import {mqttClient, cellID} from '../containers/mqtt';

class Button extends Component {

  handleClick(clickedObj) {
    const clientID = this.props.clientID;
    const model = this.props.model;
    const selectedItems = this.props.selectedItems;
    const whiteboard = this.props.whiteboard;
    var attributes = null;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;
    var msg = convertObjToArrayForPublish(model, clickedObj, clientID, null, selectedItems, attributes);
    var topic = clientID + '/' + cellID + '/' + model + '/action/1';
    if (mqttClient && cellID) {
      console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

  componentDidMount() {
    if (this.props.obj.selected === 'true') { //button that causes a menu to appear
      this.props.addSelection(this.props.model, this.props.obj.identifier, this.props.obj.contents);
    }
  }

  render() {
    const obj = this.props.obj;
    const isSelected = (obj.selected === 'true');
    if (obj.type === 'momentary' || !obj.selectionGroup) {
     return (<div className="btn btn-primary momentary" onClick={() => this.handleClick(obj)}>{obj.contents}</div>);
    } else {
      return (
        <label>
          <input type='radio' defaultChecked={isSelected} value={obj.contents} name={obj.owner} />
          <span>{obj.contents}</span>
        </label>
      );
    }
  }
}

  function mapStateToProps(state) {
    return {
  		clientID: state.clientID,
  		whiteboard: state.whiteboard,
      selectedItems: state.selectedItems
    };
  }

  export default connect(mapStateToProps, { addSelection } )(Button);
