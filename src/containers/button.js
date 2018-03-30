import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';
import { addSelection } from '../actions';
import PropTypes from 'prop-types';

import {mqttClient, cellID} from '../containers/mqtt';
import '../styles/button.scss';

class Button extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    addSelection: PropTypes.func.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired,
  }

  handleClick(clickedObj) {
    if (clickedObj.selectionGroup || clickedObj.checkForModified === 'true') { //selectionGroup in radios, checkForModified from history buttons from rtalk code app
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
    const contents = obj.contents[0].text;
    const isSelected = (obj.selected === 'true');

    if (obj.selectionGroup) {
     return (
       <label styleName='ri-button'>
         <input type='radio' defaultChecked={isSelected} onClick={() => this.handleClick(obj)} value={contents} name={obj.owner} />
         <span>{contents}</span>
       </label>
     );
    }
    else {
      return (
        <div styleName='ri-button' className="btn btn-primary momentary" onClick={() => this.handleClick(obj)}>
          {contents}
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
