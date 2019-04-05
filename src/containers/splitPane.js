import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addSelection } from '../actions';
import PropTypes from 'prop-types';
import Split from 'react-split';

import '../styles/splitPane.scss';

class SplitPane extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    addSelection: PropTypes.func.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired,
  }

  render() {
    const { obj } = this.props;
    const orientation = obj.orientation;

    if (orientation === "vert") { //vertical split
      return (
        <Split gutter sizes={[20,80]}>
          <div id={obj.identifier} className='row'>{obj.data}</div>
          <div className='row'></div>
        </Split>
      )
    } else { //horizontal splut
      return (
        <Split gutter sizes={[20,80]}>
          <div className='col-sm'></div>
          <div id={obj.identifier} className='col-sm'>{obj.data}</div>
        </Split>
      );
    }
  }
}

function mapStateToProps(state) {
  return {
    clientID: state.clientID,
    whiteboard: state.whiteboard,
    selectedItems: state.selectedItems
  };
}

export default connect(mapStateToProps, { addSelection })(SplitPane);
