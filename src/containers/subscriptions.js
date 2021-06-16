import React, { Component } from 'react';
import { connect } from 'react-redux';
import { updateMqttSubscriptions } from '../actions';
import '../styles/subscriptions.scss';

export class Subscriptions extends Component {
    handleClick(description, topic) {
        const {updateMqttSubscriptions} = this.props;

        //all of these have to use the cell id, which is not immediately available in the render portion
        const subscriptions = this.props.subscriptions;
        if(topic == 'admin/nodeAdmin') {
            topic = '+/' + subscriptions.cellId + '/admin/nodeAdmin/#';
        } else if(topic == "events") {
            topic = '+/' + subscriptions.cellId + '/' + subscriptions.cellId + "/events/#";
        } else if(topic == "console") {
            topic = '+/' + subscriptions.cellId + '/console/#';
        } else if(topic == "action") {
            topic = '+/' + subscriptions.cellId + '/+/action/#';
        }

        updateMqttSubscriptions(description, topic);
    }
    
    render() {
        return (
            <div styleName="subscriptions">
                <ul>
                    <li><p styleName="description">Used to filter MQTT channels:</p></li>
                    <li>
                        <input type="checkbox" name="all_messages" value="+/#" defaultChecked={true} onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>ALL MESSAGES</label>
                    </li>
                    <li>
                        <input type="checkbox" name="widget_messages" value='admin/nodeAdmin' onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>WIDGETS</label>
                    </li>
                    <li>
                        <input type="checkbox" name="events_messages" value="events" onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>EVENTS</label>
                    </li>
                    <li>
                        <input type="checkbox" name="console_messages" value="console" onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>CONSOLE</label>
                    </li>
                    <li>
                        <input type="checkbox" name="log_messages" value="+/+/log/#" onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>LOG</label>
                    </li>
                    <li>
                        <input type="checkbox" name="action_messages" value="action" onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>ACTIONS</label>
                    </li>
                </ul>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        subscriptions: state.subscriptions
    }
}

export default connect(mapStateToProps, {updateMqttSubscriptions})(Subscriptions)
