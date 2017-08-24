import React, {Component} from 'react';
import { connect } from 'react-redux';
import { updateWhiteboard } from '../actions';
import {getStyleAndCreateHierarchy, convertArrayToKeyValues} from '../scripts/functions';

class Whiteboard extends Component {

  componentDidUpdate(prevProps, prevState) {
    // console.log("PREVPROPS: ", prevProps);
    // console.log("Whiteboard: ", this.props.whiteboard);
    if (prevProps.latestMessage !== this.props.latestMessage) {
      var ObjFromArray = convertArrayToKeyValues(this.props.latestMessage);
      this.props.updateWhiteboard(
        getStyleAndCreateHierarchy(ObjFromArray, this.props.whiteboard)
      );
    }
  }

  renderApp(newObj) {
    var arr = Object.keys(newObj);
    return (<div>
    {
    arr.map((key) => {
      var val = newObj[key];
      console.log("key:", key, " val:", val);
      if (val.identifier && val !== null && typeof val === 'object' && Object.prototype.toString.call( val ) !== '[object Array]') { //if type object but not style obj, null, or array
         return (<div style={val.style} className={val.identifier} key={val.identifier}>{this.renderApp(val)}</div>)
      }
      else if (Array.isArray(val)) {
        return (
          <div key={val.toString()}>
            {
              val.map((arrayVal) => {
                return(
                <div className={arrayVal} key={arrayVal}></div>
              );
              })
            }
          </div>
        )
      } else {
        //<div className={key + '_' + newObj.identifier} key={key + '_' + newObj.identifier}></div>
       return (
        null
      );
    }
  })
  }
  </div>);
}

  render() {
      if (this.props.whiteboard) {
        var arr = Object.keys(this.props.whiteboard);
        return (<div>{
          arr.map((model) => { //map through each app
            var obj = this.props.whiteboard[model];
            return (
              <div key={model} className="col-xl-6">
                <div className="card">
                  <div className="card-header">{obj.label}</div>
                  <div className="card-block" style={{position: "relative", margin: "1.25rem", padding: "0"}}>
                    {this.renderApp(obj)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
      } else
      return null;
    }

}



function mapStateToProps(state) {
  return {
		latestMessage: state.latestMessage,
    whiteboard: state.whiteboard
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
