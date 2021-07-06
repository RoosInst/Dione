import React, { Component } from 'react'
import { connect } from 'react-redux';

import Split from './newSplitPane';
import Button from './button';
import ListPane from './listPane';
import TextPane from './textPane';
import TreePane from './treePane';

export class CardBody extends Component {
    
    renderApp(model, obj, layout, firstIndex, lastIndex) {
        //On the first time through gets the child of "top"
        //After the first time the correct object will always be passed in
        let currentObj;
        if(firstIndex == 0) {
            currentObj = obj[layout[firstIndex]];
        } else {
            currentObj = obj;
        }  
        console.info('in render app: ', currentObj);
        //checks to see if there is a split pane
        if(currentObj.identifier.includes('split')) {
            //gets the correct orientation for the split pane (its reversed)
            let splitOrientation;
            if(currentObj.orientation == 'horiz') {
            splitOrientation = 'vertical';
            } else {
            splitOrientation = 'horizontal';
            }
            //gets the two objects that will be contained within the current split pane
            let firstObj = currentObj[layout[firstIndex+1]];
            let secondObj = currentObj[layout[lastIndex]];
            //gets the component for the first object (TextPane, ListPane, etc ...)
            let firstPane = this.renderObj(model, firstObj, layout, firstIndex+1, lastIndex-1);
            //gets the component for the second object (TextPane, ListPane, etc ...)
            let secondPane = this.renderObj(model, secondObj, layout, firstIndex+2, lastIndex-1);

            //returns a split pane component with the two components created above
            return (
                <Split 
                    identifier={currentObj.identifier}
                    model={model}
                    obj={currentObj}
                    firstPane={firstPane}
                    secondPane={secondPane}
                    orientation={splitOrientation}
                />
            );
        }
    }

    renderObj(model, obj, layout, firstIndex, lastIndex) {
    console.info('in renderObj:', obj)
        if (obj.class && model !== 'console') {
            switch (obj.class) {
                case 'Button':
                    return <Button key={obj.identifier} model={model} obj={obj} />;
            
                case 'ListPane':
                    //return <div style={{whiteSpace:'nowrap', overflow:'scroll'}}>This is a test to see what happens when i resize</div>
                    return <ListPane model={model} obj={obj} key={obj.identifier}/>;
            
                case 'TextPane':
                    return <TextPane model={model} obj={obj} key={obj.identifier}/>;
            
                case 'TreePane':
                    return <TreePane model={model} obj={obj} key={obj.identifier}/>;
            
                //if it is another split pane, repeat the process in renderApp
                case 'SplitPane':
                        return this.renderApp(model, obj, layout, firstIndex, lastIndex);
            
                default: return <TextPane model={model} obj={obj} key={obj.identifier}/>;
            }
        
        } else return null;
    }

    render() {
        const { model, obj, renderOrderArray, firstIndex, lastIndex } = this.props;
        
        return (
            <div className="card-body">
                {this.renderApp(model, obj, renderOrderArray, firstIndex, lastIndex)}
            </div>
            
        )
    }
}

function mapStateToProps(state) {
    return {
      whiteboard: state.whiteboard,
    };
}

export default connect(mapStateToProps, {})(CardBody);

