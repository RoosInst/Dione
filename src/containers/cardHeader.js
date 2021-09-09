import React, { Component } from 'react';
import { connect } from 'react-redux';

import FavIcon from '../../public/images/favicon.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowClose, faWindowMinimize} from '@fortawesome/free-regular-svg-icons';

import { mqttClient } from './Mqtt';

import { removeApplication, minimizeApplication } from '../actions/whiteboardInfo';

const RtCbor = require('../scripts/RtCbor');
import cbor from 'cbor';
let rtCbor = new RtCbor();

export class CardHeader extends Component {
    handleClose(model) { //delete app, clicking on close 'X' button
        rtCbor.encodeArrayNew([null]);
        this.props.removeApplication(model);
        //mqttClient.publish(topic, cborPubMsg);

        //NEED TO MAKE THIS GENERAL FOR ALL APPLICATIONS
        let topic = 'X016OK8G:RET235R/X016OK8G/msgTool/unsubscribe/4'
        mqttClient.publish(topic, rtCbor.buffers[0]);
        console.info('Encoded CBOR: ', cbor.decodeAllSync(rtCbor.getCborAsBuffer()) );
        
        return null;
    }

    handleMinimize(model) {
        this.props.minimizeApplication(model);
    }

    render() {
        const { model, obj } = this.props;
        
        return (
            <div className="card-header">
                <img style={{ width: '16px', margin: '-2px 5px 0 5px' }} src={FavIcon} />
                <span className="cardLabel">{obj.label}</span>
                <FontAwesomeIcon className="cardMinimize" style={{cursor: 'pointer'}} icon={faWindowMinimize} onClick={() => this.handleMinimize(model)}/>
                <FontAwesomeIcon className="cardClose" style={{cursor: 'pointer'}} icon={faWindowClose} onClick={() => this.handleClose(model)}/>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { model } = ownProps;
    const obj = state.whiteboardInfo.openApplications[model];
    return { obj };
}

export default connect(mapStateToProps, { removeApplication, minimizeApplication })(CardHeader);
