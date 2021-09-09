import React, { Component } from 'react'
import CardHeader from './CardHeader';
import CardMenuBar from './cardMenuBar';
import CardBody from './CardBody';

export class Card extends Component {
    render() {
        const { model } = this.props;

        return (
            <div className="card">
                <CardHeader model={model}  />
                <CardMenuBar model={model} />
                <CardBody  model={model} />
            </div>
        )
    }
}

export default Card;

