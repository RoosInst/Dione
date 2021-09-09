import React, { Component } from 'react'
import { connect } from 'react-redux';
import { untabApplication } from '../actions/whiteboardInfo';
import '../styles/applicationTab.scss';

class ApplicationsTab extends Component {
    onClick = (model) => {
        this.props.untabApplication(model);
    }

    render() {
        return (
            <div>
            {
                this.props.tabs.map(model => {
                    const tabStyle = this.props.tabbedApplications.includes(model) ? 'minimized' : 'open';

                    return (
                        <div 
                            key={`${model}_tab`}
                            onClick={() => this.onClick(model)}
                            styleName={tabStyle}
                        >
                            {model}
                        </div>
                    );   
                })
            }
            </div>
            
        )
    }
}

const mapStateToProps = (state) => ({
    tabs: state.whiteboardInfo.tabLabels,
    tabbedApplications: Object.keys(state.whiteboardInfo.tabbedApplications)
})

export default connect(mapStateToProps, { untabApplication })(ApplicationsTab);
