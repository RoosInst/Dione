import React, {Component} from 'react';
import { connect } from 'react-redux';
import {mqttClient, cellID} from '../containers/mqtt';
import { updateWhiteboard } from '../actions';

import Pane from './pane';
import Button from './button';

const cbor = require('cbor');
const mqtt = require('mqtt');
import {Responsive, WidthProvider} from 'react-grid-layout';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

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

  handleClick(model) { //delete app, clicking on close 'X' button
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

  transformContextMenus(wb) {
     var wbArr = Object.keys(wb);
    wbArr.map((model) => {
      var modelElement = document.getElementById(model);
      var transformStyle = modelElement.style.transform;
      if (!transformStyle) transformStyle = 'translate(10px, 10px)'; //won't be stored in store initially, but defaults to translate(10px, 10px)

      var tempNum = 10;
      var exitFirstNum = false;

      while(true) {
        if (isNaN(transformStyle.charAt(tempNum))) {
           tempNum++;
           exitFirstNum = true;
        }
        else if (exitFirstNum === true) break;
        else tempNum++;
      }

      var newStyle = transformStyle.slice(0, 10) + '-' + transformStyle.slice(10, tempNum + 1) + '-' + transformStyle.slice(tempNum + 1); //makes negative translate of parent element being translated

      var navElements = modelElement.getElementsByTagName("nav");
      for (var i = 0; i < navElements.length; i++) {
       navElements[i].style.transform = newStyle;
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.whiteboard && this.props.whiteboard !== prevProps.whiteboard) {
      var wbArr = Object.keys(this.props.whiteboard);
      var prevWbArr = null;

      this.transformContextMenus(this.props.whiteboard); //if wb updates, always reapply transforms in case apps autoshift on deletion

      if (prevProps.whiteboard) {
        prevWbArr = Object.keys(prevProps.whiteboard);
      }

      if (wbArr && prevWbArr && wbArr.length > prevWbArr.length) { //added an app
        let difference = wbArr.filter(x => !prevWbArr.includes(x));
        difference.map((model) => { //difference should only be by 1, but map just in case instead of [0]
          var modelElement = document.getElementById(model);
          modelElement.addEventListener("mouseup", () => this.transformContextMenus(this.props.whiteboard));
        });
      }

       else if (wbArr) { //will only be 1 model that exists, but use map just in case instead of [0]
        wbArr.map((model) => {
          document.getElementById(model).addEventListener("mouseup", () => this.transformContextMenus(this.props.whiteboard));
        });
      } //else no more wb, so dom element removed along with its event listener
    }
  }

  render() {
      if (this.props.whiteboard) {
        var arr = Object.keys(this.props.whiteboard);
        return (
          <ResponsiveReactGridLayout rowHeight={30} className='layout' breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}} cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}>

          <div id='mqttInfo' key='mqttInfo' data-grid={{x: 0, y: 0, w: 14, h: 1, static: true}}>
            <div className="pull-left">Client ID: {this.props.clientID}</div>
            <div className="pull-right">
              Connection
              <div className={`pull-right connectionIcon ${this.props.mqttConnection}`} />
            </div>
          </div>
          {
          arr.map((model) => { //map through each app
            var obj = this.props.whiteboard[model];
            return (
              <div id={model} key={model} data-grid={{x: 0, y: 0, w: 4, h: 16}}>
                <div className="card">
                  <div className="card-header">
                    <img style={{width: '16px', margin: '-2px 5px 0 5px'}} src='/app/images/favicon.ico'/>
                    <span className="cardLabel">{obj.label}</span><i onClick={() => this.handleClick(model)} className="pull-right fa fa-window-close"></i></div>
                  <div className="card-block">
                    {this.renderApp(model, obj)}
                  </div>
                </div>
              </div>
            );
          })
          }
        </ResponsiveReactGridLayout>
      );
      } else return (
        <ResponsiveReactGridLayout rowHeight={30} className='layout' breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}} //rowHeight=30 gives correct min height
    cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}>
          <div id='mqttInfo' data-grid={{x: 0, y: 0, w: 2, h: 2}}>
            <div className="pull-left">Client ID: {this.props.clientID}</div>
            <div className="pull-right">
              Connection
              <div className={`pull-right connectionIcon ${this.props.mqttConnection}`} />
            </div>
          </div>
        </ResponsiveReactGridLayout>
      )
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
