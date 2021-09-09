/*
********************************************************************************





OLD COMPONENT THAT CONTAINS INFORMATION ON HOW TO RESIZE SPLIT PANE
WHEN THE WHOLE GRID ITEM IS RESIZED






********************************************************************************
*/







import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Modal from './modal';
import Card from './Card';

import { updateWhiteboard, updateWhiteboardLayout, updatePaneSize } from '../actions';
import { publishArray } from '../scripts/functions';

import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveGridLayout = WidthProvider(Responsive);

export class GridLayout extends Component {
  
    static propTypes = {
        whiteboard: PropTypes.object,
        updateWhiteboard: PropTypes.func.isRequired,
        updateWhiteboardLayout: PropTypes.func.isRequired,
        whiteboardLayout: PropTypes.object.isRequired
    }

    //******************** 
    //SECTION ON DROPPPING
    //******************** 
    onDrop(layout, item) {
        let channel = item.i;
        this.props.updateWhiteboardLayout(item, true, channel); 

        let message = [null, 'view', 'console'];
        let topic = 'X016OK8G:RET235R/X016OK8G/' + this.props.currentChannel + '/subscribe/4';
        publishArray(topic, message);
    }

    //******************** 
    //SECTION ON DRAGGING
    //******************** 
    onDragStop(layout, oldItem, newItem) {
        this.props.updateWhiteboardLayout(newItem, true, newItem.i)
    }

    //******************** 
    //SECTION ON RESIZING
    //******************** 
    onResizeStart(layout, oldItem) {
        let applicationName = oldItem.i;
        if(this.props.paneSize[applicationName] == undefined) {
            let application = $(`#${applicationName}`);
            let paneSizeHeight = application.innerHeight();
            let paneSizeWidth = application.innerWidth();

            //changes the initial height from % to px 
            application.find('.Pane1').each(function() {
                if($(this).hasClass('horizontal')) {
                    let height = $(this).innerHeight() * 1;
                    $(this).innerHeight(height);
                } else {
                    let width = $(this).innerWidth() * 1;
                    $(this).innerWidth(width);
                }   
            })
            this.props.updatePaneSize(applicationName, paneSizeHeight, paneSizeWidth, 'update');
        }
    }
    onResize(layout, oldItem, newItem) {
        const { paneSize } = this.props;
        let applicationName = newItem.i;
        let applicationChanged = $(`#${applicationName}`);
        let newPaneSizeHeight = applicationChanged.innerHeight();
        let newPaneSizeWidth = applicationChanged.innerWidth();

        let widthProportion = newPaneSizeWidth / paneSize[applicationName].width;
        let heightProportion = newPaneSizeHeight / paneSize[applicationName].height;
        
        applicationChanged.find('.Pane1').each(function() {
            if($(this).hasClass('horizontal')) {
                let height = $(this).innerHeight() * heightProportion;
                $(this).innerHeight(height);
            } else {
                let width = $(this).innerWidth() * widthProportion;
                $(this).innerWidth(width);
            }   
        })
        this.props.updatePaneSize(applicationName, newPaneSizeHeight, newPaneSizeWidth, 'update');
    }
    onResizeStop(layout, oldItem, newItem) {
        this.props.updateWhiteboardLayout(newItem, true, newItem.i)
    }


    //**************
    //RENDER SECTION
    //**************
    render() {
        const { whiteboard, whiteboardLayout, currentChannel} = this.props; 
        
        let arr = [];
        if (whiteboard) {
            arr = [...Object.keys(whiteboard)];   
        } 

        return (
            <ResponsiveGridLayout className="layout" key="grid" margin={[0.5, 0.5]} arr={arr}
                        cols={{lg: 1000, md: 10, sm: 6, xs: 4}} rowHeight={1} breakpoints={{lg: 1200}}
                        compactType={null} preventCollision={true} draggableHandle='.card-header'
                        isDroppable={true} droppingItem={{i:currentChannel, w:300, h:300}} 
                        onDrop={(layout, item) => this.onDrop(layout, item)}
                        onDragStop={(layout, oldItem, newItem) => this.onDragStop(layout, oldItem, newItem)} 
                        onResizeStart={(layout, oldItem) => this.onResizeStart(layout, oldItem)}
                        onResize={(layout, oldItem, newItem) => this.onResize(layout, oldItem, newItem)}
                        onResizeStop={(layout, oldItem, newItem) => this.onResizeStop(layout, oldItem, newItem)}
            >
                {
                    arr.map(model => { //map through each app
                        const obj = whiteboard[model];
                        const objMenus = []; //if toppane has dropdown menus, keys to menus will be in here
                        Object.keys(obj).map(key => {
                            if (key.includes('Menu')) objMenus.push(key);
                        });
                
                        return (
                            <div key={model} id={model} data-grid={whiteboardLayout.layouts[model]}>  
                                <Modal key="modal" obj={obj} model={model} />
                                <Card key={model + "card"} model={model} obj={obj} objMenus={objMenus}/>     
                            </div>
                        );
                    })
                }
            </ResponsiveGridLayout>  
        )
    }
}

function mapStateToProps(state) {
    return {
      whiteboard: state.whiteboard,
      whiteboardLayout: state.whiteboardLayout,
      paneSize: state.paneSize,
      currentChannel: state.currentChannel
    }
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout, updatePaneSize })(GridLayout)
