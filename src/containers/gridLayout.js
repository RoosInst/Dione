import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { mqttClient, cellID } from './mqtt';

import Modal from './modal';

import { convertObjToArrayForPublish, renderApp } from '../scripts/functions';
import { updateWhiteboard, updateWhiteboardLayout, updatePaneSize } from '../actions';

import FavIcon from '../../public/images/favicon.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowClose } from '@fortawesome/free-regular-svg-icons';
import '../styles/gridLayout.scss';

const RtCbor = require('../scripts/RtCbor');
import cbor from 'cbor';
let rtCbor = new RtCbor();

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

    handleClose(model) { //delete app, clicking on close 'X' button
         /*
        _________________________________________________________
        THIS CREATES THE EXACT SAME MESSAGE AS THE JAVA VERSION
        (still unsure about the msgNumber)
        _________________________________________________________
        */
       
        const {connectionDetails, subscriptions} = this.props;
        const application = connectionDetails[model];
        let topic = `${subscriptions.cellId}:${application[0][4]}/${subscriptions.cellId}/admin/nodeAdmin/6/disconnect`;
        console.info(connectionDetails);
        console.info(model);
        console.info(application[0][1]);
        console.info(subscriptions);
        console.info(topic);
        
        
        // let topic = this.props.clientID + '/' + cellID + '/' + model + '/unsubscribe/1',
        //     omap_start = Buffer.from('9f', 'hex'), // hex x9F, cbor start byte for unbounded arrays
        //     omap_cborTag = Buffer.from('d3', 'hex'), // hex xD3, start object map (omap cbor tag)
        //     omap_end = Buffer.from('ff', 'hex'), // hex xFF, cbor end byte for unbounded arrays
        //     unsub = 'unsubscribe',
        //     cborModel = model;
        let msgArray = [
            "disconnect",    //VALUE in tagged object
            application[0][1],  //REASON
            "shutdown",      //SHUTDOWN
            "channel",       //CHANNEL
            application[0][4],  //VALUE OF CHANNEL
            "nodeName",      //NODENAME
            application[0][6],  //VALUE OF NODENAME
            "mqttId",        //MQTTID
            application[0][8],  //VALUE OF MQTTID
            "domain",        //DOMAIN
            application[0][10]  //VALUE OF DOMAIN
        ]
       
            //eval proper js with RtCbor -- not validated
            //let closeMsg = {null: {'unsubscribe',model}}
            //RtCbor.encodeOMap(closeMsg)

        //RtCbor.endocdeArray([omap_start, omap_cborTag, unsub, omap_end, omap_start, omap_cborTag, cborModel, omap_end]);
        //let cborPubMsg = smCbor({unsubscribe{ } })
        rtCbor.encodeArrayNew(msgArray);
        let forest = $.extend({}, this.props.whiteboard); //deep clone, do not alter redux store (treat as immutable)
        delete forest[model];
        this.props.updateWhiteboard(forest, model);
        //mqttClient.publish(topic, cborPubMsg);
        mqttClient.publish(topic, rtCbor.buffers[0]);
        console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) );
        
        return null;
    }

    changeProportions(application, paneSize) {
       
        let applicationChanged = $(`#${application}`);
        let newPaneSizeHeight = applicationChanged.innerHeight();
        let newPaneSizeWidth = applicationChanged.innerWidth();

        let widthProportion = newPaneSizeWidth / paneSize[application].width;
        let heightProportion = newPaneSizeHeight / paneSize[application].height;
        console.info(widthProportion);
        console.info(heightProportion);
        $('.Pane1').each(function() {
            if($(this).hasClass('horizontal')) {
                let height = $(this).innerHeight() * heightProportion;
                $(this).innerHeight(height);
            } else {
                let width = $(this).innerWidth() * widthProportion;
                $(this).innerWidth(width);
            }
            
            
        })

     


        this.updatePaneSize(application, newPaneSizeHeight, newPaneSizeWidth);
        
    }

    onLayoutChange(layout) {
        this.updateWhiteboardLayout(layout, false, ""); //updates layout based upon current layout
        
        //changeProportions(this.arr);
        this.arr.forEach(model => {
            if(this.paneSize[model] == undefined) {
                let application = $(`#${model}`);
                let paneSizeHeight = application.innerHeight();
                let paneSizeWidth = application.innerWidth();
                this.updatePaneSize(model, paneSizeHeight, paneSizeWidth);
            } else {
                this.changeProportions(model, this.paneSize);
            }
        })
        

    }
   

    render() {
        const { whiteboard, clientID, selectedItems, paneSize, whiteboardLayout, updateWhiteboardLayout, renderOrder, updatePaneSize} = this.props; 
        
        let arr;
       
        if (whiteboard) {
            console.info('whiteboard:', whiteboard);
            arr = Object.keys(whiteboard);
        } 
       
        if(arr == undefined) {
            return false;
        }
        
        return (
            <ResponsiveGridLayout className="layout" key="grid" arr={arr} changeProportions={this.changeProportions} paneSize={paneSize} updatePaneSize={updatePaneSize} layouts={whiteboardLayout.layouts} onLayoutChange={this.onLayoutChange} updateWhiteboardLayout={updateWhiteboardLayout} cols={{lg: 12, md: 10, sm: 6, xs: 4}} rowHeight={60} breakpoints={{lg: 1200}} compactType={null} preventCollision={true} draggableHandle='.card-header'>
                {arr.map(model => { //map through each app
                    updateWhiteboardLayout({}, true, model); //adds the model to the layout
                    updateWhiteboardLayout({}, true, model); //establishes the model within the layout so that other things will render around it
                    
                    const obj = whiteboard[model];
                    const objMenus = []; //if toppane has dropdown menus, keys to menus will be in here
                    Object.keys(obj).map(key => {
                    if (key.includes('Menu')) objMenus.push(key);
                    });
                    return (
                    <div key={model} id={model}>  
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
                                {renderApp(model, obj, renderOrder[model], 0, renderOrder[model].length-1)}
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
      whiteboardLayout: state.whiteboardLayout,
      subscriptions: state.subscriptions,
      renderOrder: state.renderOrder,
      connectionDetails: state.connectionDetails,
      paneSize: state.paneSize
    };
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout, updatePaneSize })(GridLayout);
