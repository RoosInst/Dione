import React, { Component } from 'react'
import { connect } from 'react-redux';

import { mqttClient, cellID } from './Mqtt';
import { convertObjToArrayForPublish } from '../scripts/functions';

import '../styles/cardMenuBar.scss';

export class CardMenuBar extends Component {
    render() {
        const { model, obj, objMenus } = this.props;
    
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
                                        return <li className='react-contextmenu-item'
                                            tabIndex='0'
                                            onMouseDown={e => e.preventDefault()}
                                            key={key}
                                            onClick={() => {
                                            let attributes;
                                            if (obj.attributes) {
                                                attributes = obj.attributes;
                                            } 
                                            // const msg = convertObjToArrayForPublish(model, menuObj, clientID, riString, selectedItems, attributes),
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
    const obj = state.whiteboardInfo.openApplications[model];
    const objMenus = []; //if toppane has dropdown menus, keys to menus will be in here
    Object.keys(obj).map(key => {
        if (key.includes('Menu')) objMenus.push(key);
    });

    return { obj, objMenus};
    
}

export default connect(mapStateToProps, {})(CardMenuBar);

