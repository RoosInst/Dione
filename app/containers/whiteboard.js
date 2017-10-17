import React, {Component} from 'react';
import { connect } from 'react-redux';
import MQTT, {mqttClient, cellID} from './mqtt';
import { updateWhiteboard } from '../actions';
import Modal from 'react-modal';

import Pane from './pane';
import Button from './button';

const cbor = require('cbor');
const mqtt = require('mqtt');

class Whiteboard extends Component {

  renderApp(model, newObj) {

    var arr = Object.keys(newObj);
    var objectInside = false;
    for (var i = 0; i < arr.length; i++) { //if no object inside besides style or *Menu, then don't render (or else empty div appears)
      var val = newObj[arr[i]];
      if (arr[i] !== 'style' && arr[i].indexOf('Menu') < 0 &&  val!== null && typeof val === 'object' && Object.prototype.toString.call(val) !== '[object Array]') {
         objectInside = true;
         break;
      }
       else {
         continue;
      }
    }
    if (objectInside) {
    return (
      <div className="shell">
        {
          arr.map((key) => {
            var val = newObj[key];
            //console.log("key:", key, " val:", val);

            //if type is object but not style, attributes, or Menu obj, null, or array. Menu obj never has objects inside it, so no need to go through
            if (key !== 'style' && key !== 'attributes' && key.indexOf('Menu') < 0 && val !== null && typeof val === 'object' && Object.prototype.toString.call( val ) !== '[object Array]') {
               return (<div className={val.class} style={val.style} id={model + '_' + val.identifier} key={val.identifier}>{this.renderObj(model, val)}{this.renderApp(model, val)}</div>)
            }
             else return (null);
          })
        }
      </div>);
    } else return null;
  }

  renderObj(model, obj) {
    var menu = null;

    if (obj.class) {
      switch(obj.class) {
        case 'Button':
          return <Button model={model} obj={obj}/>
        case 'TextPane':
        case 'ListPane':
          return <Pane model={model} obj={obj}/>;

        default: return null;
      }
    } else return null;
  }

  handleClick(model) { //delete app, clicking on close 'X' button
    var omap_start = Buffer.from('9f', 'hex'); // hex x9F, cbor start byte for unbounded arrays
    var omap_cborTag = Buffer.from('d3', 'hex'); // hex xD3, start object map (omap cbor tag)
    var omap_end = Buffer.from('ff', 'hex'); // hex xFF, cbor end byte for unbounded arrays
    var unsub = cbor.encode('unsubscribe');
    var cborModel = cbor.encode(model);

    var topic = this.props.clientID + '/' + cellID + '/' + model + '/unsubscribe/1';
    var cborPubMsg = Buffer.concat([omap_start, omap_cborTag, unsub, omap_end, omap_start, omap_cborTag, cborModel, omap_end]);

    var forest = $.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
    delete forest[model];
    this.props.updateWhiteboard(forest, model);
    mqttClient.publish(topic, cborPubMsg);

    return null;
  }

  componentDidMount() {
    var options = {
        cellHeight: '29px',
        alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    $('.grid-stack').gridstack(options);
  }

  componentDidUpdate(prevProps) {
    if (this.props.whiteboard && this.props.whiteboard !== prevProps.whiteboard) {
      var wbArr = Object.keys(this.props.whiteboard);
      var prevWbArr = null;

      if (prevProps.whiteboard) {
        prevWbArr = Object.keys(prevProps.whiteboard);
      }

      if (wbArr && prevWbArr && wbArr.length > prevWbArr.length) { //added an app
        let difference = wbArr.filter(x => !prevWbArr.includes(x));
        difference.map((model) => { //difference should only be by 1, but map just in case instead of [0]
            $('.grid-stack').data('gridstack').makeWidget($('#'+model));
        });
      }
      else if (wbArr && !prevWbArr) { //will only be 1 model that exists, but use map just in case instead of [0]
        wbArr.map((model) => {
          $('.grid-stack').data('gridstack').makeWidget($('#'+model));
        });
      }
    }
  }

  componentWillUpdate(nextProps) { //remove grid widget if about to be deleted
    if (this.props.whiteboard && this.props.whiteboard !== nextProps.whiteboard) {
      var wbArr = Object.keys(this.props.whiteboard);
      var nextWbArr = null;

      if (nextProps.whiteboard) {
        nextWbArr = Object.keys(nextProps.whiteboard);
      }

      if (wbArr && nextWbArr && wbArr.length > nextWbArr.length) { //added an app
        let difference = wbArr.filter(x => !nextWbArr.includes(x));
        difference.map((model) => { //difference should only be by 1, but map just in case instead of [0]
            $('.grid-stack').data('gridstack').removeWidget($('#'+model), false);
        });
      }
      else if (wbArr && !nextWbArr) { //will only be 1 model that exists, but use map just in case instead of [0]
        wbArr.map((model) => {
          $('.grid-stack').data('gridstack').removeWidget($('#'+model), false);
        });
      }
    }
  }

  render() {
    var arr = null;
    if (this.props.whiteboard) arr = Object.keys(this.props.whiteboard);
    return (
      <div>
        <MQTT />
        <div id='mqttInfo'>
          <div className="pull-left">Client ID: {this.props.clientID}</div>
          <div className="pull-right">
            Connection
            <div className={`pull-right connectionIcon ${this.props.mqttConnection}`} />
          </div>
        </div>

        <div className='grid-stack'>
          {
            arr ?
              arr.map((model) => { //map through each app
                var obj = this.props.whiteboard[model];
                return (
                  <div id={model} className='grid-stack-item' key={model} data-gs-auto-position data-gs-height='12' data-gs-width='4'>
                    <Modal className='reactModal' isOpen={obj.dialog ? true : false}>
                      <div className="card dialog">
                        <div className="card-header">
                          <img style={{width: '16px', margin: '-2px 5px 0 5px'}} src='/app/images/favicon.ico'/>
                          <span className="cardLabel">{obj.dialog ? obj.dialog.label : ''}</span>
                          <i className='pull-right fa fa-window-close' onClick={() => {
                            var forest = $.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
                            delete forest[model].dialog; //delete from redux when closing
                            this.props.updateWhiteboard(forest, model);
                            }}
                          />
                        </div>
                        <div className="card-body">
                          {obj.dialog ?
                            <div className='shell'>
                            <ul>
                              {obj.dialog.contents.map((content, key) => {
                                return <li key={key}>{content}</li> //no need for content.text
                              })}
                            </ul>
                            <div className='dialogBottom'>
                              <div className='btn btn-primary btn-small pull-left momentary'>
                                {obj.dialog.addButton}
                              </div>
                              <div className='btn btn-primary btn-small pull-right momentary'>
                                Cancel
                              </div>
                            </div>
                          </div>
                            : ''
                          }
                        </div>
                      </div>
                    </Modal>

                    <div className='grid-stack-item-content'>
                      <div className="card">
                        <div className="card-header">
                          <img style={{width: '16px', margin: '-2px 5px 0 5px'}} src='/app/images/favicon.ico'/>
                          <span className="cardLabel">{obj.label}</span>
                          <i onClick={() => this.handleClick(model)} className="pull-right fa fa-window-close" />
                        </div>
                        <div className="card-body">
                          {this.renderApp(model, obj)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            : ''
          }
        </div>

      </div>
    );
  }

}



function mapStateToProps(state) {
  return {
    whiteboard: state.whiteboard,
    clientID: state.clientID,
    mqttConnection: state.mqttConnection
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
