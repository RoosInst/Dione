import React, {Component} from 'react';
import { connect } from 'react-redux';
import { addSelection, updateMousePosition } from '../actions';
import eol from 'eol'; //some line endings inconsistent (CR with CRLF)
import PropTypes from 'prop-types';
import ContextMenus from './contextMenus';
//import { mqttClient, cellID } from '../containers/mqtt';

class Pane extends Component {
  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired
  }

  handleClick(event) {
    const {obj, updateMousePosition} = this.props;
    event.preventDefault();
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    updateMousePosition(obj.identifier, mouseX,mouseY);
  }

	render() {
    const { obj, model } = this.props;
    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }
    if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
      return (
        <div style={obj.style} id={model + '_' + obj.identifier} key={model + '_' + obj.identifier} onContextMenu={() => this.handleClick(event)}>
          <ContextMenus fullMenu={obj[menu]} model={model} identifier={obj.identifier}/>
          {
            obj.contents && obj.contents[0] ?
              Array.isArray(obj.contents) && obj.contents[0].highlight ? //if highlight exists, then assuming array will only be length 1 (contents[0]). contents[0] sometimes undefined, so check
              <pre>
                {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
                <span className='highlight'>
                  {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
                </span>
                {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
              </pre>
            : //no highlight
              <pre>{eol.lf(obj.contents[0].text)}</pre>
            : <span style={{whiteSpace: 'pre'}} />
          }
        </div>  
      );
    }
    else if (obj.contents) {
      return (<span style={{whiteSpace: 'pre'}}>{eol.lf(obj.contents[0].text)}</span>);
    }
    else return null; //else no obj.contents

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

export default connect(mapStateToProps, { addSelection, updateMousePosition } )(Pane);
