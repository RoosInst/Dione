import React, { Component } from 'react'
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import { updatePaneSize } from '../actions';

export class Split extends Component {
 
   
    render() {
        let firstPaneKey = this.props.firstPane.key;
        let secondPaneKey = this.props.secondPane.key;
        
        return (
            <SplitPane split={this.props.orientation} minSize={20} maxSize={-20} defaultSize={`${this.props.obj.divider}%`}> 
                <div key={firstPaneKey}>{this.props.firstPane}</div>
                <div key={secondPaneKey}>{this.props.secondPane}</div>
            </SplitPane>  
        )
    }
}

function mapStateToProps(state) {
    return {
      whiteboard:state.whiteboard
    };
}

export default connect(mapStateToProps, {updatePaneSize})(Split);
