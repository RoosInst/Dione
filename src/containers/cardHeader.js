import React, { Component } from 'react';
import { connect } from 'react-redux';

import FavIcon from '../../public/images/favicon.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowClose } from '@fortawesome/free-regular-svg-icons';

import { mqttClient } from './mqtt';

import { updateWhiteboard } from '../actions';

const RtCbor = require('../scripts/RtCbor');
import cbor from 'cbor';
let rtCbor = new RtCbor();

export class CardHeader extends Component {
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

    render() {
        const { model, obj } = this.props;

        return (
            <div className="card-header">
                <img style={{ width: '16px', margin: '-2px 5px 0 5px' }} src={FavIcon} />
                <span className="cardLabel">{obj.label}</span>
                <FontAwesomeIcon className="cardClose" icon={faWindowClose} onClick={() => this.handleClose(model)}/>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        whiteboard: state.whiteboard,
        subscriptions: state.subscriptions,
        connectionDetails: state.connectionDetails
    };
}

export default connect(mapStateToProps, { updateWhiteboard })(CardHeader);
