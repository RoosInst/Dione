import React, { Component } from 'react'
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Modal from './modal';
import Card from './card';

import { updateWhiteboard, updateWhiteboardLayout, updatePaneSize } from '../actions';

import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveGridLayout = WidthProvider(Responsive);
export class GridLayout extends Component {
  
    static propTypes = {
        whiteboard: PropTypes.object,
        updateWhiteboard: PropTypes.func.isRequired,
        updateWhiteboardLayout: PropTypes.func.isRequired,
        whiteboardLayout: PropTypes.object.isRequired
    }

    changeProportions(application, paneSize) {
        let applicationChanged = $(`#${application}`);
        let newPaneSizeHeight = applicationChanged.innerHeight();
        let newPaneSizeWidth = applicationChanged.innerWidth();

        let widthProportion = newPaneSizeWidth / paneSize[application].width;
        let heightProportion = newPaneSizeHeight / paneSize[application].height;
        
        applicationChanged.find('.Pane1').each(function() {
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
        //updates layout based upon current layout after a resize
        this.updateWhiteboardLayout(layout, false, ""); 

        //adjusts the splitPanes' size when the grid element is resized
        this.arr.forEach(model => {
            if(this.paneSize[model] == undefined) {
                let application = $(`#${model}`);
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

                this.updatePaneSize(model, paneSizeHeight, paneSizeWidth);
            } else {
                this.changeProportions(model, this.paneSize);
            }
        })
    }
  
    render() {
        const { whiteboard, paneSize, whiteboardLayout, updateWhiteboardLayout, updatePaneSize} = this.props; 
        
        let arr;
        if (whiteboard) {
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
                            <Card key={model + "card"} model={model} obj={obj} objMenus={objMenus}/>     
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
      whiteboardLayout: state.whiteboardLayout,
      paneSize: state.paneSize
    };
}

export default connect(mapStateToProps, { updateWhiteboard, updateWhiteboardLayout, updatePaneSize })(GridLayout);
