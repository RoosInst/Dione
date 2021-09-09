import React, { Component } from 'react';
import { connect } from 'react-redux';
import { addMqttSubscription, removeMqttSubscription } from '../actions/connectionInfo';
import '../styles/subscriptions.scss';

class Subscriptions extends Component {
    handleClick(description, topic) {
        const { cellId, mqttClient, subscriptions, addMqttSubscription,removeMqttSubscription } = this.props;
        //all of these have to use the cell id, which is not immediately available in the render portion
        if(topic == 'admin/nodeAdmin') {
            topic = '+/' + cellId + '/admin/nodeAdmin/#';
        } else if(topic == "events") {
            topic = '+/' + cellId + '/' + cellId + "/events/#";
        } else if(topic == "console") {
            topic = '+/' + cellId + '/console/#';
        } else if(topic == "action") {
            topic = '+/' + cellId + '/+/action/#';
        }

        if(Object.keys(subscriptions).includes(description)) {
            mqttClient.unsubscribe(topic);
            removeMqttSubscription(description);
        } else {
            mqttClient.subscribe(topic, {qos: 2});
            addMqttSubscription(description, topic);
        }
    }
    
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div styleName="subscriptions" >
                <ul>
                    <li><p styleName="description">Used to filter MQTT channels:</p></li>
                    <li>
                        <input type="checkbox" name="all_messages" value="+/#"  onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
                        <label>ALL MESSAGES</label>
                    </li>
                    <li>
                        <input type="checkbox" name="widget_messages" value='admin/nodeAdmin' defaultChecked={true} onChange={(e) => this.handleClick(e.target.name, e.target.value)}/>
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
        );
    }
}

const mapStateToProps = (state) => ({
    cellId: state.connectionInfo.cellId,
    subscriptions: state.connectionInfo.mqttSubscriptions,
    mqttClient: state.connectionInfo.mqttClient
})

export default connect(mapStateToProps, { addMqttSubscription, removeMqttSubscription })(Subscriptions)
