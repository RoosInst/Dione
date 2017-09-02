import React, {Component} from 'react';
import { connect } from 'react-redux';
import {getStyleAndCreateHierarchy, getRiStringAsLi} from '../scripts/functions';

import Pane from './pane';

class Whiteboard extends Component {

  renderApp(model, newObj) {
    var arr = Object.keys(newObj);
    return (
      <div className="shell">
        {
          arr.map((key) => {
            var val = newObj[key];
            //console.log("key:", key, " val:", val);
            if (val.identifier && val.style && val !== null && typeof val === 'object' && Object.prototype.toString.call( val ) !== '[object Array]') { //if type object but not style obj, null, or array
               return (<div className={val.class} style={val.style} id={model + '_' + val.identifier} key={val.identifier}>{this.renderObj(model, val, this.props.clientID)}{this.renderApp(model, val)}</div>)
            }

            else if (Array.isArray(val)) {
              var i = 0;
              return (
                <div className="shell" key={'arrayShell' + (i + 1)}>
                  {
                    val.map((arrayVal) => {
                      i++;
                      return(
                      <div className='shell' key={'array' + i}></div>
                    );
                    })
                  }
                </div>
              )
            }
             else return (null);
          })
        }
      </div>);
  }

  renderObj(model, obj) {
    var menu = null;

    if (obj.class) {
      switch(obj.class) {
        case 'Button':
          if (obj.type === 'momentary') {
           return (<div className="btn btn-primary momentary">{obj.contents}</div>);
          }
         case 'TextPane':
         case 'ListPane':
          return <Pane model={model} obj={obj}/>;

        default: return null;
      }

    }
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
                  <div className="card-header"><span style={{textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '94%'}}>{obj.label}</span><i className="pull-right fa fa-window-close"></i></div>
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

export default connect(mapStateToProps, null)(Whiteboard);
