import React, { Component } from 'react';
import { connect } from 'react-redux';
//import Modal from './modal';
//<Modal key={`${model}_modal`} model={model} />
import Card from './Card';
import { Rnd } from 'react-rnd';
import { beginLayoutUdpdate, finishDragLayoutUdpdate, finishResizeLayoutUdpdate } from '../actions/whiteboardInfo';


class GridLayoutItem extends Component {
    onDragStop = (e, d, model) => {
        this.props.finishDragLayoutUdpdate(model, d.x, d.y);
    }

    onResizeStop = (e, direction, ref, model) => {
        this.props.finishResizeLayoutUdpdate(model, ref.style.width, ref.style.height);
    }

    render() {
        const { model, layout } = this.props;
        
        return (
            <Rnd
                size={{ width: layout.w, height: layout.h }}
                position={{ x: layout.x, y: layout.y }}
                onDragStart={() => this.props.beginLayoutUdpdate(model)}
                onDragStop={(e, d) => this.onDragStop(e, d, model)}
                onResizeStart={() => this.props.beginLayoutUdpdate(model)}
                onResizeStop={(e, direction, ref) => this.onResizeStop(e, direction, ref, model)}
                dragHandleClassName='card-header'
                bounds='.whiteboard'
                style={{zIndex: layout.z}}
            >   
         
                <Card key={`${model}_card`} model={model} />     
            </Rnd>
        ); 
    }
}

const mapStateToProps = (state, ownProps) => {
    const { model } = ownProps;
    const layout = state.whiteboardInfo.layouts[model];
    return { layout };
};

export default connect(mapStateToProps, { beginLayoutUdpdate, finishDragLayoutUdpdate, finishResizeLayoutUdpdate })(GridLayoutItem);
