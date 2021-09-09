import React, { Component } from 'react';
import SplitPane from 'react-split-pane';

class Split extends Component {
    render() {
        let firstPaneKey = this.props.firstPane.key;
        let secondPaneKey = this.props.secondPane.key;
        
        return (
            <SplitPane split={this.props.orientation} minSize={20} maxSize={-20} defaultSize={`${this.props.obj.divider}%`}> 
                <div key={firstPaneKey}>{this.props.firstPane}</div>
                <div key={secondPaneKey}>{this.props.secondPane}</div>
            </SplitPane>  
        );
    }
}

export default Split;
