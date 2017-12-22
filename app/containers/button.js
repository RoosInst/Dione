import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';
import { addSelection } from '../actions';

const cbor = require('cbor');
import {mqttClient, cellID} from '../containers/mqtt';

class Button extends Component {

  handleClick(clickedObj) {
    if (clickedObj.selectionGroup) {
      this.props.addSelection(this.props.model, clickedObj.identifier, clickedObj.contents, clickedObj.selectionGroup);
    }
    const { clientID, model, selectedItems, whiteboard } = this.props;

    let attributes;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

    const msg = convertObjToArrayForPublish(model, clickedObj, clientID, null, selectedItems, attributes),
      topic = clientID + '/' + cellID + '/' + model + '/action/1';

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
    const { obj } = this.props;
    const isSelected = (obj.selected === 'true');

    if (obj.selectionGroup) {
     return (
       <label>
         <input type='radio' defaultChecked={isSelected} onClick={() => this.handleClick(obj)} value={obj.contents.text} name={obj.owner} />
         <span>{obj.contents.text}</span>
       </label>
     );
    }
    else {
      return (
        <div className="btn btn-primary momentary" onClick={() => this.handleClick(obj)}>
          {obj.contents.text}
        </div>
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
