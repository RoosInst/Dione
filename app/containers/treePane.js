import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Treebeard } from 'react-treebeard';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

import { addSelection } from '../actions';
import { convertObjToArrayForPublish } from '../scripts/functions';
import * as filters from '../scripts/filter';
import TreeStyle from '../styles/treePane_style';
import { mqttClient, cellID } from '../containers/mqtt';

class TreePane extends Component {

  constructor(props){
      super(props);
      this.data = this.props.obj.contents ? this.formTree()
      : null;
      this.state = {data: this.data};
      this.onToggle = this.onToggle.bind(this);

  }



  onToggle(node, toggled) { //node = modified riString
      const { whiteboard, obj, model, clientID, selectedItems, addSelection } = this.props;

      addSelection(model, obj.identifier, node);

      if (this.state.cursor) this.state.cursor.active = false;
      node.active = true;
      if (node.children) node.toggled = toggled;
      this.setState({ cursor: node });

      let attributes;
      if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

      const msg = convertObjToArrayForPublish(model, obj, clientID, node, selectedItems, attributes),
        topic = clientID + '/' + cellID + '/' + model + '/action/1';

      if (mqttClient && cellID) {
        console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
        mqttClient.publish(topic, msg);
      }
  }



  onFilterMouseUp(e) {
      const filter = e.target.value.trim();
      if (!filter) return this.setState({data: this.data});

      let filteredArray = [];
      this.data.map(root => { //this.data is array, may contain multiple roots (in jsonTrees)
        let filtered = filters.filterTree(root, filter);
        filteredArray.push(filters.expandFilteredNodes(filtered, filter));
      });
      this.setState({data: filteredArray});
  }



  formTree() {
    const { obj } = this.props;
    let jsonTrees = [], //support multiple trees (multiple root levels)
      currentParents = [],
      lastItem = {};
    let treePointer = jsonTrees;

    obj.contents.map(item => {

      if (item.indent) { //if not root (root given no indent)
        if (item.indent > lastItem.indent) { //if child
          currentParents.push(lastItem); //last sibling was a parent
            let lastParentName = currentParents[currentParents.length - 1].name;
            for (let i = 0; i < treePointer.length; i++) {
              if (treePointer[i].name == lastParentName) {
                treePointer = treePointer[i];
                treePointer.children = [];
                treePointer = treePointer.children;
                treePointer.push({name: item.text, header: item.header});
                break;
              }
            };
        }
        else if (item.indent == lastItem.indent) { //if sibling
          treePointer.push({name: item.text, header: item.header});
        }
        else { //if parent of other children, update currentParentsList (remove expired parents)
          let newParentsList = [];
          currentParents.map(parent => {
            if (item.indent > parent.indent) newParentsList.push({name: parent.name, indent: parent.indent}); //old parent still a parent
          });
          currentParents = newParentsList;

          //reset treePointer to lowest parent
          treePointer = jsonTrees;
          currentParents.map(parent => { //ignore root parent
            //assume treePointer always pointing to children array
            for (let i = 0; i < treePointer.length; i++) {
              if (treePointer[i].name == parent.name) {
                treePointer = treePointer[i].children;
                break;
              }
            }
          });
          treePointer.push({name: item.text, header: item.header});
        }
      }
      else { //root
        jsonTrees.push({name: item.text, toggled: true});

        //treePointer pointing to root obj still
      };
      lastItem = {name: item.text, indent: item.indent ? item.indent : 0, header: item.header};
    });

    return jsonTrees;
  }



  handleClick(riString, clickedObj) { //no need for addSelection

    const { model, clientID, selectedItems, whiteboard } = this.props;

    let attributes;
    if (whiteboard[model].attributes) attributes = whiteboard[model].attributes;

    const msg = convertObjToArrayForPublish(model, clickedObj, clientID, riString, selectedItems, attributes),
      topic = clientID + '/' + cellID + '/' + model + '/action/1';

    if (mqttClient && cellID) {
      console.info("Publishing -\n Topic: " + topic + "\n Message: " +  msg);
      mqttClient.publish(topic, msg);
    }
  }



	render() {

    this.handleClick = this.handleClick.bind(this);
    const {obj, model, clientID, selectedItems } = this.props;

    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }

     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
       return (
         <div className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
             {obj.contents ? //assume array, no need to check
               <div className='shell'>
                   <input
                     onKeyUp={this.onFilterMouseUp.bind(this)}
                     placeholder="Search..."
                     type="text"/>
                  <Treebeard data={this.state.data} style={TreeStyle} onToggle={this.onToggle} />
               </div>
              : ''
             }
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
               obj[menu].value.map((menuItem, key) => {
                 if (menuItem) {
                 return(
                   <MenuItem key={key} onClick={() => this.handleClick(menuItem, obj[menu])}>
                       {menuItem.text}
                   </MenuItem>
                 );
               } else return;
             })
            }
          </ContextMenu>
         </div>
       );
     }
     else if (obj.contents) {
        <Treebeard data={this.state.data} style={TreeStyle} onToggle={this.onToggle} />  //can also set animations={false}, but without it arrows don't change
	   }
     else return null; //else no obj.contents
	}
}

function mapStateToProps(state) {
  return {
		clientID: state.clientID,
		whiteboard: state.whiteboard,
    selectedItems: state.selectedItems
  };
}

export default connect(mapStateToProps, { addSelection } )(TreePane);
