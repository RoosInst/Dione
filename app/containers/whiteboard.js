import React, {Component} from 'react';
import { connect } from 'react-redux';
import { updateWhiteboard } from '../actions';
import {getStyleAndCreateHierarchy, convertArrayToKeyValues, renderApp} from '../scripts/functions';

class Whiteboard extends Component {

  componentDidUpdate(prevProps, prevState) {
    if ((!prevProps.latestMessage && this.props.latestMessage.payload) || prevProps.latestMessage.payload !== this.props.latestMessage.payload) {
      var ObjFromArray = convertArrayToKeyValues(this.props.latestMessage.payload);
      this.props.updateWhiteboard(
        getStyleAndCreateHierarchy(ObjFromArray, this.props.whiteboard, this.props.latestMessage.model)
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
                    {renderApp(model, obj, this.props.clientID)}
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
    whiteboard: state.whiteboard,
    clientID: state.clientID
  };
}

export default connect(mapStateToProps, { updateWhiteboard })(Whiteboard);
