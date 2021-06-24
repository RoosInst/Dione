import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { mqttClient, cellID } from './mqtt';
import Button from './button';
import ListPane from './listPane';
import TextPane from './textPane';
import TreePane from './treePane';
import SplitPane from './splitPane';
import Modal from './modal';

import { convertObjToArrayForPublish } from '../scripts/functions';
import { updateWhiteboard, updateWhiteboardLayout } from '../actions';

import FavIcon from '../../public/images/favicon.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowClose } from '@fortawesome/free-regular-svg-icons';
import '../styles/gridLayout.scss';

import RtCbor from '../scripts/RtCbor';

import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveGridLayout = WidthProvider(Responsive);

export class GridLayout extends Component {

    static propTypes = {
        clientID: PropTypes.string.isRequired,
        whiteboard: PropTypes.object,
        selectedItems: PropTypes.object.isRequired,
        updateWhiteboard: PropTypes.func.isRequired,
        updateWhiteboardLayout: PropTypes.func.isRequired,
        whiteboardLayout: PropTypes.object.isRequired
    }

    renderApp(model, newObj) {

        let arr = Object.keys(newObj);
        let objectInside = false;
        for (let i = 0; i < arr.length; i++) { //if no object inside besides style or *Menu, then don't render (or else empty div appears)
            let val = newObj[arr[i]];
            if (arr[i] !== 'style' && !arr[i].includes('Menu') && val !== null && typeof val === 'object' && Object.prototype.toString.call(val) !== '[object Array]') {
            objectInside = true;
            break;
            }
            else {
            continue;
            }
        }
        if (objectInside) {
            return [
            arr.map(key => {
                let val = newObj[key];
                //console.log("key:", key, " val:", val);

                //if type is object but not style, attributes, or Menu obj, null, or array. Menu obj never has objects inside it, so no need to go through
                if (key !== 'style' && key !== 'attributes' && !key.includes('Menu') && val !== null && typeof val === 'object' && Object.prototype.toString.call(val) !== '[object Array]') {
                return (
                    <div style={val.style} id={model + '_' + val.identifier} key={model + '_' + val.identifier}>
                    {this.renderObj(model, val)}
                    {this.renderApp(model, val)}
                    </div>
                );
                }
                else return null;
            })
            ]
        }
        else return null;
    }

    renderObj(model, obj) {
        if (obj.class && model !== 'console') {
            switch (obj.class) {
            case 'Button':
                return <Button model={model} obj={obj} />;

            case 'ListPane':
                return <ListPane model={model} obj={obj} />;

            case 'TextPane':
                return <TextPane model={model} obj={obj} />;

            case 'TreePane':
                return <TreePane model={model} obj={obj} />;

            case 'SplitPane':
                return <SplitPane model={model} obj={obj} />;

            default: return null;
            }
        } else return null;
    }

    handleClose(model) { //delete app, clicking on close 'X' button
        let topic = this.props.clientID + '/' + cellID + '/' + model + '/unsubscribe/1',
            omap_start = Buffer.from('9f', 'hex'), // hex x9F, cbor start byte for unbounded arrays
            omap_cborTag = Buffer.from('d3', 'hex'), // hex xD3, start object map (omap cbor tag)
            omap_end = Buffer.from('ff', 'hex'), // hex xFF, cbor end byte for unbounded arrays
            unsub = 'unsubscribe',
            cborModel = model;
        
            //eval proper js with RtCbor -- not validated
            //let closeMsg = {null: {'unsubscribe',model}}
            //RtCbor.encodeOMap(closeMsg)

        RtCbor.endocdeArray([omap_start, omap_cborTag, unsub, omap_end, omap_start, omap_cborTag, cborModel, omap_end]);
        //let cborPubMsg = smCbor({unsubscribe{ } })
        let forest = $.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
        delete forest[model];
        this.props.updateWhiteboard(forest, model);
        //mqttClient.publish(topic, cborPubMsg);
        mqttClient.publish(topic, RtCbor.getCborAsBuffer);
        
        return null;
    }

    onLayoutChange(layout) {
        this.updateWhiteboardLayout(layout, false, ""); //updates layout based upon current layout
    }

    render() {
        const { whiteboard, clientID, selectedItems, whiteboardLayout, updateWhiteboardLayout} = this.props; 
        
        let arr;
       
        if (whiteboard) arr = Object.keys(whiteboard);
       
        if(arr == undefined) {
            return false;
        }
    
        return (
            <ResponsiveGridLayout className="layout" key="grid" layouts={whiteboardLayout.layouts} onLayoutChange={this.onLayoutChange} updateWhiteboardLayout={updateWhiteboardLayout} cols={{lg: 12, md: 10, sm: 6, xs: 4}} rowHeight={60} breakpoints={{lg: 1200}} compactType={null} preventCollision={true}>
                {arr.map(model => { //map through each app
                    updateWhiteboardLayout({}, true, model); //adds the model to the layout
                    updateWhiteboardLayout({}, true, model); //establishes the model within the layout so that other things will render around it
                    const obj = whiteboard[model];
                    const objMenus = []; //if toppane has dropdown menus, keys to menus will be in here
                    Object.keys(obj).map(key => {
                    if (key.includes('Menu')) objMenus.push(key);
                    });
                    return (
                    <div key={model}>  
                        <Modal key="modal" obj={obj} model={model} />

                        <div className="card">
                            <div className="card-header">
                            <img style={{ width: '16px', margin: '-2px 5px 0 5px' }} src={FavIcon} />
                            <span className="cardLabel">{obj.label}</span>
                            <FontAwesomeIcon className="cardClose" icon={faWindowClose} onClick={() => this.handleClose(model)}/>
                            </div>
                            {objMenus.length > 0 && (
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
                                            if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;
                                            const msg = convertObjToArrayForPublish(model, menuObj, clientID, riString, selectedItems, attributes),
                                                topic = clientID + '/' + cellID + '/' + model + '/action/1';
            
                                            if (mqttClient && cellID) {
                                                console.info("Publishing -\n Topic: " + topic + "\n Message: " + msg);
                                                mqttClient.publish(topic, msg);
                                            }
                                            }}
                                        >{riString.text}</li>
                                        })}
                                    </ul>
                                    </div>
                                );
                                })}
                            </div>
                            )}  
                            <div className="card-body">  
                            {this.renderApp(model, obj)}   
                            </div>
                        </div> 
                    </div>
                    );
                })}
                
            </ResponsiveGridLayout>
        )
    }
}

function mapStateToProps(state) {
    return {
      whiteboard: state.whiteboard,
      clientID: state.clientID,
      selectedItems: state.selectedItems,
      whiteboardLayout: state.whiteboardLayout
    };
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout })(GridLayout);
