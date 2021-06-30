import React, {Component} from 'react';
import { connect } from 'react-redux';
import { convertObjToArrayForPublish } from '../scripts/functions';
import { addSelection, updatePaneSize } from '../actions';
import eol from 'eol'; //some line endings inconsistent (CR with CRLF)
import PropTypes from 'prop-types';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { mqttClient, cellID } from '../containers/mqtt';

class Pane extends Component {
  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired
  }

  handleClick(riString, clickedObj) {

    const { model, clientID, selectedItems, whiteboard } = this.props;

    let attributes;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

    const msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes),
      topic = clientID + '/' + cellID + '/' + model + '/action/1';

    if (mqttClient && cellID) {
      console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }

	render() {
    this.handleClick = this.handleClick.bind(this);
    const { obj, paneSize, updatePaneSize } = this.props;

    const handleClick1 = (event) => {
      event.preventDefault();
      let mouseX = event.clientX;
      let mouseY = event.clientY;
      updatePaneSize('MousePosition',mouseY,mouseX);
      this.forceUpdate();
    };

    const handleClose = () => {
      this.mouseY = null;
      this.mouseX = null;
      updatePaneSize('MousePosition',this.mouseY,this.mouseX)
      this.forceUpdate();
    };

    //updatePaneSize('MousePosition',null,null);
    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }
     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
      console.info(paneSize.MousePosition.height); 
      return (
         <div id={obj.identifier} onContextMenu={handleClick1} style={{ height: '50px', width: '50px', cursor: 'context-menu' }}>
              {  obj.contents && obj.contents[0] ?
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
                 //ContextMenuTrigger needs child, so render empty span
              }
           <Menu keepMounted
            open={paneSize.MousePosition.height !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={ paneSize.MousePosition.height !== null && paneSize.MousePosition.width !== null
              ? { top: paneSize.MousePosition.height, left: paneSize.MousePosition.width }
              : undefined }
            >
             {
               obj[menu].value.map((menuItem, key) => {
                 if (menuItem) {
                 return(
                   <MenuItem key={key} onClick={() => handleClose()}>
                       {menuItem.text}
                   </MenuItem>
                 );
               } else return
             })
            }
          </Menu>
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
    paneSize: state.paneSize
  };
}

export default connect(mapStateToProps, { addSelection, updatePaneSize } )(Pane);
