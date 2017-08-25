import React, {Component} from 'react';
import { connect } from 'react-redux';
import { updateWhiteboard } from '../actions';
import {getStyleAndCreateHierarchy, convertArrayToKeyValues, renderApp} from '../scripts/functions';

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

  render() {
      if (this.props.whiteboard) {
        var arr = Object.keys(this.props.whiteboard);
        return (<div className="row">{
          arr.map((model) => { //map through each app
            var obj = this.props.whiteboard[model];
            return (
              <div key={model} className={`${arr.length == 1 ? 'col-xl-12' : 'col-xl-6'}`}>
                <div className="card">
                  <div className="card-header">{obj.label}</div>
                  <div className="card-block">
                    {renderApp(obj)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
      } else return null;
    }
}



function mapStateToProps(state) {
  return {
		latestMessage: state.latestMessage,
    whiteboard: state.whiteboard
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
