import React, { Component } from 'react';
import { connect } from 'react-redux';
import GridLayoutItem from './GridLayoutItem';

class GridLayout extends Component {
    render() {
        return (
            <div className='whiteboard' style={{height:'100%', width:'100%'}}>
            {
                this.props.applications.map(model => <GridLayoutItem key={model} model={model} />)
            }
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    applications: Object.keys(state.whiteboardInfo.openApplications)
});

export default connect(mapStateToProps)(GridLayout);