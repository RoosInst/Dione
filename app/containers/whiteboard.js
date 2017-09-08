import React, {Component} from 'react';
import { connect } from 'react-redux';
import {mqttClient, cellID} from '../containers/mqtt';
import { updateWhiteboard } from '../actions';

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

            //if type is object but not style or Menu obj, null, or array. Menu obj never has objects inside it, so no need to go through
            if (key !== 'style' && key.indexOf('Menu') < 0 && val !== null && typeof val === 'object' && Object.prototype.toString.call( val ) !== '[object Array]') {
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

    }
  }

  handleClick(model) {
    var omap_start = Buffer.from('9f', 'hex'); // hex x9F, cbor start byte for unbounded arrays
    var omap_cborTag = Buffer.from('d3', 'hex'); // hex xD3, start object map (omap cbor tag)
    var omap_end = Buffer.from('ff', 'hex'); // hex xFF, cbor end byte for unbounded arrays
    var unsub = cbor.encode('unsubscribe');
    var cborModel = cbor.encode(model);

    var topic = this.props.clientID + '/' + cellID + '/' + model + '/unsubscribe/1';
    var cborPubMsg = Buffer.concat([omap_start, omap_cborTag, unsub, omap_end, omap_start, omap_cborTag, cborModel, omap_end]);

    var forest = jQuery.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
    delete forest[model];
    this.props.updateWhiteboard(forest, model);
    mqttClient.publish(topic, cborPubMsg);

    return null;
  }

  render() {
      if (this.props.whiteboard) {
        var arr = Object.keys(this.props.whiteboard);
        return (<div className="row">
          {
          arr.map((model) => { //map through each app
            var obj = this.props.whiteboard[model];
            return (
              <div key={model} className={`${arr.length == 1 ? 'col-xl-12' : 'col-xl-6'}`}>
                <div className="card">
                  <div className="card-header"><span className="cardLabel">{obj.label}</span><i onClick={() => this.handleClick(model)} className="pull-right fa fa-window-close"></i></div>
                  <div className="card-block">
                    {this.renderApp(model, obj)}
                  </div>
                </div>
              </div>
            );
          })
          }
        </div>
      );
      } else return null;
    }
}



function mapStateToProps(state) {
  return {
    whiteboard: state.whiteboard,
    clientID: state.clientID
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
