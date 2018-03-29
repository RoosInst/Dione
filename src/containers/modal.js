import React, {Component} from 'react';
import ReactModal from 'react-modal';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import {mqttClient, cellID} from './mqtt';
import { updateWhiteboard, addSelection } from '../actions';
import FavIcon from '../../public/images/favicon.png';

const cbor = require('cbor');

ReactModal.setAppElement('#app');

class Modal extends Component {

  static propTypes = {
    addSelection: PropTypes.func.isRequired,
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired,
    updateWhiteboard: PropTypes.func.isRequired
  }

  //handle selecting (and thus closing/deleting) modal
  handleModal(model, clickedObj, selected, delDialog) { //don't bother making target active upon click, disappears before it can show (tested)

    let dialog = clickedObj.dialog;
    this.props.addSelection(model, clickedObj.dialog.widget, selected);

    let topic = this.props.clientID + '/' + cellID + '/' + model + '/action/1',
      objVal = cbor.encode('event'),
      omap_start = Buffer.from('9f', 'hex'), // hex x9F, cbor start byte for unbounded arrays
      omap_cborTag = Buffer.from('d3', 'hex'), // hex xD3, start object map (omap cbor tag)
      omap_end = Buffer.from('ff', 'hex'), // hex xFF, cbor end byte for unbounded arrays
      selectorKey = cbor.encode('selector'),
      selectorVal = cbor.encode(dialog.selector),
      channelKey = cbor.encode('channel'),
      channelVal = cbor.encode(this.props.clientID),
      selectionKey = cbor.encode('selection'),
      selectionVal = cbor.encode(selected.header ? selected.tag ?  selected.header + selected.tag + selected.text : selected.header + selected.text : selected.text),
      cookieKey = cbor.encode('cookie'),
      cookieVal = cbor.encode(dialog.cookie),
      attributesBuffer;
      if (clickedObj.attributes) {
        let atrs = Object.keys(clickedObj.attributes);
        atrs.map(attr => {
          if (attributesBuffer) attributesBuffer = Buffer.concat([attributesBuffer, cbor.encode(attr), cbor.encode(clickedObj.attributes[attr])]);
          else attributesBuffer = Buffer.concat([cbor.encode(attr), cbor.encode(clickedObj.attributes[attr])]);
        });
      }
      let cborMsg;
      if (clickedObj.attributes) cborMsg = Buffer.concat([omap_start, omap_cborTag, objVal, selectorKey, selectorVal, channelKey, channelVal, selectionKey, selectionVal, cookieKey, cookieVal, attributesBuffer, omap_end]);
      else cborMsg = Buffer.concat([omap_start, omap_cborTag, objVal, selectorKey, selectorVal, channelKey, channelVal, selectionKey, selectionVal, cookieKey, cookieVal, omap_end]);
      if (mqttClient && cellID) {
        console.info("Publishing -\n Topic: " + topic + "\n Message: " +  cborMsg);
        mqttClient.publish(topic, cborMsg);
      }
      delDialog();
  }

  delDialog(model) {
    let forest = $.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
    delete forest[model].dialog; //delete from redux when closing
    this.props.updateWhiteboard(forest, model);
  }

  render() {
    const { obj, model } = this.props;
    return (
      <ReactModal className='reactModal' isOpen={obj.dialog ? true : false}>
        <div className="card dialog">
          <div className="card-header">
            <img style={{width: '16px', margin: '-2px 5px 0 5px'}} src={FavIcon} />
            <span className="cardLabel">{obj.dialog ? obj.dialog.label : ''}</span>
            <i className='pull-right fa fa-window-close' onClick={() => this.delDialog(model)} />
          </div>
          <div className="card-body">
            {obj.dialog && (
              <ul>
                {obj.dialog.contents.map((content, key) => {
                  return (
                    <li
                      onClick={() => this.handleModal(model, obj, content, () => this.delDialog(model))}
                      key={key+'_'+content.text}>
                        {content.text}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ReactModal>
    );
  }
}

function mapStateToProps(state) {
  return {
    whiteboard: state.whiteboard,
    clientID: state.clientID,
  };
}

export default connect(mapStateToProps, { updateWhiteboard, addSelection })(Modal);
