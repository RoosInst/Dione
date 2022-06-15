import React, { Component } from 'react'
import { connect } from 'react-redux';

import { mqttClient, cellID } from './Mqtt';
import { convertObjToArrayForPublish, sendMsg } from '../scripts/functions';
import RtCbor from '../scripts/RtCbor';
import '../styles/cardMenuBar.scss';
let rtCbor = new RtCbor();
export class CardMenuBar extends Component {
    render() {
        const { model, channel, cellId, obj, objMenus } = this.props;
        console.info("IN CARD MENU BAR")
        return (  
            objMenus.length > 0 && 
                <div styleName='topMenuBar'>
                    {objMenus.map(menuKey => {
                        let menuObj = obj[menuKey];
                        return (
                            <div key={model + '_' + menuObj.identifier} styleName='topMenuItem'>
                                <button className="dropdown-toggle" type="button" id={model + '_' + menuObj.identifier} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    {menuObj.title}
                                </button>
                                <ul className="dropdown-menu" aria-labelledby={model + '_' + menuObj.identifier}>
                                    {menuObj.value.map((riString, key) => { //add react-contextmenu-item to inherit same style as contextmenus
                                        console.info("RI String: ", riString);
                                        return <li className='react-contextmenu-item'
                                            tabIndex='0'
                                            onMouseDown={e => e.preventDefault()}
                                            key={key}
                                            onClick={() => {
                                            let attributes;
                                            if (obj.attributes) {
                                                attributes = obj.attributes;
                                            } 
                                            //const msg = convertObjToArrayForPublish(model, menuObj, channel, riString, riString, attributes);
                                            //console.info(rtCbor.decodeAll(msg));
                                            
                                            sendMsg(model, menuObj, cellId, channel, riString, riString, attributes);
                                            rtCbor.clearTemp();
                                            //     topic = clientID + '/' + cellID + '/' + model + '/action/1';

                                            // if (mqttClient && cellID) {
                                            //     console.info("Publishing -\n Topic: " + topic + "\n Message: " + msg);
                                            //     mqttClient.publish(topic, msg);
                                            // }
                                            }}
                                        >{riString.text}</li>
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div> 
        );
    }
}

function mapStateToProps(state, ownProps) {
    const { model } = ownProps;
    const channel = state.connectionInfo.whiteboardChannels[model];
    const cellId = state.connectionInfo.cellId;
    const obj = state.whiteboardInfo.openApplications[model];
    const objMenus = []; //if toppane has dropdown menus, keys to menus will be in here
    Object.keys(obj).map(key => {
        if (key.includes('Menu')) objMenus.push(key);
    });
    return { channel, cellId, obj, objMenus };
}

export default connect(mapStateToProps, {})(CardMenuBar);

