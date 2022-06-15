import React, { Component } from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';

class Split extends Component {
    render() {
        //console.info(this.props.layout)
        let firstPaneKey = this.props.firstPane.key;
        let secondPaneKey = this.props.secondPane.key;
        //console.info('re-rendering split pane')
        return (
            <SplitPane split={this.props.orientation} minSize={20} maxSize={-20} defaultSize={`${this.props.obj.divider}%`} size={200}> 
                <div key={firstPaneKey}>{this.props.firstPane}</div>
                <div key={secondPaneKey}>{this.props.secondPane}</div>
            </SplitPane>  
        );
    }
}

const mapStateToProps = (state) => ({
    layout: state.whiteboardInfo.layouts
})

export default connect(mapStateToProps)(Split);
