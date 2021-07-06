import React, { Component } from 'react'
import { connect } from 'react-redux';
import CardHeader from './cardHeader';
import CardMenuBar from './cardMenuBar';
import CardBody from './cardBody';
export class Card extends Component {
    render() {
        const { model, obj, objMenus, renderOrder } = this.props;

        return (
            <div className="card">
                <CardHeader model={model} obj={obj} />
                {(objMenus.length > 0) && <CardMenuBar model={model} obj={obj} objMenus={objMenus}/>}
                <CardBody  model={model} obj={obj} renderOrderArray={renderOrder[model]} firstIndex={0} lastIndex={renderOrder[model].length-1}/>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        renderOrder: state.renderOrder
    };
}

export default connect(mapStateToProps, {})(Card);

