import React, { Component } from 'react'
import { connect } from 'react-redux';
import Split from './splitPane';
// import Button from './button';
// import ListPane from './listPane';
import TextPane from './TextPane';
// import TreePane from './treePane';

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
            let startOfNextItem, secondObj;
            let firstObj;

            //THIS WORKS FOR SPLITPANE ... IS THERE A BETTER WAY
            //ASK HOW MANY ITEMS THE MOST COMPLEX ITEM WILL HAVE
            for(let i = 0; i < layout.length; i++) {
                if(currentObj[layout[i]]) {
                    firstObj = currentObj[layout[i]];
                    startOfNextItem = i + 1;
                    break;
                }
            }
            for(let j = startOfNextItem; j < layout.length; j++) {
                if(currentObj[layout[j]]) {
                    secondObj = currentObj[layout[j]];
                }
            }
            // let firstObj = currentObj[layout[firstIndex+1]];
            // let secondObj = currentObj[layout[firstIndex+2]];   //THIS HAD TO BE CHANGED ... LOOK INTO DOCS FOR THE REASON
            //I THINK THAT SOMETHING WAS ADDED THAT MESSES UP MY LAYOUT ARRAY ... TALK TO MARK OR DIG INTO DOCS TO MAKE SURE I HAVE IT RIGHT
            console.info("firstObject", firstObj);
            console.info("SecondObj", secondObj);
            console.info("Layout", layout)
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
        if (obj.class && model !== 'console') {
            switch (obj.class) {
                // case 'Button':
                //     return <Button key={obj.identifier} model={model} obj={obj} />;
            
                // case 'ListPane':
                //     //return <div style={{whiteSpace:'nowrap', overflow:'scroll'}}>This is a test to see what happens when i resize</div>
                //     return <ListPane model={model} obj={obj} key={obj.identifier}/>;
            
                case 'TextPane':
                    return <TextPane model={model} obj={obj} key={obj.identifier}/>;
            
                // case 'TreePane':
                //     return <TreePane model={model} obj={obj} key={obj.identifier}/>;
            
                //if it is another split pane, repeat the process in renderApp
                case 'SplitPane':
                        return this.renderApp(model, obj, layout, firstIndex, lastIndex);
            
                default: 
                    return <TextPane model={model} obj={obj} key={obj.identifier}/>;
            }
        } else return null;
    }

    render() {
        const { model, obj, renderOrder } = this.props;
        const firstIndex = 0;
        const lastIndex = renderOrder.length - 1;
        console.info("obj", obj);
        console.info("render order: ", renderOrder);
        return (
            <div className="card-body" >
                {this.renderApp(model, obj, renderOrder, firstIndex, lastIndex)}
            </div>
        );
    }
}

function mapStateToProps(state, ownProps) {
    const { model } = ownProps;
    const obj = state.whiteboardInfo.openApplications[model];
    const renderOrder = state.whiteboardInfo.renderOrder[model];
    return { obj, renderOrder };
}

export default connect(mapStateToProps, {})(CardBody);

