import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';

const cbor = require('cbor');
import {mqttClient, cellID} from '../containers/mqtt';

class Button extends Component {

  handleClick(clickedObj) {
    const clientID = this.props.clientID;
    const model = this.props.model;
    var msg = convertObjToArrayForPublish(model, clickedObj, clientID, null, null);
    var topic = clientID + '/' + cellID + '/' + model + '/action/1';
    if (mqttClient && cellID) {
      console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

  render() {
    const obj = this.props.obj;
    console.log('obj', obj);
    if (obj.type === 'momentary' || !obj.selectionGroup) {
     return (<div className="btn btn-primary momentary" onClick={() => this.handleClick(obj)}>{obj.contents}</div>);
    } else {
      console.log('obj.contents', obj.contents);
     return (
       <div>
         <input type='radio' name={obj.owner} value={obj.contents} />
          {obj.contents}
       </div>
     );
    }
  }
}

  function mapStateToProps(state) {
    return {
  		clientID: state.clientID,
  		whiteboard: state.whiteboard,
    };
  }

  export default connect(mapStateToProps, null )(Button);
