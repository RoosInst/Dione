import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Treebeard, decorators } from 'react-treebeard';
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import PropTypes from 'prop-types';

import { addSelection } from '../actions';
import { convertObjToArrayForPublish } from '../scripts/functions';
import * as filters from '../scripts/filter';
import TreeStyle from '../styles/treePane_style';
import { mqttClient, cellID } from './mqtt';
import '../styles/treePane.scss';



//Customize Header to show riString color
decorators.Header = ({style, node}) => { // eslint-disable-line react/display-name, react/prop-types
  return (
      <div style={style.base}>
          <div className={Number.isInteger(node.color) ? 'rsColor' + node.color : undefined} style={style.title}>
              {node.name}
          </div>
      </div>
  );
};



class TreePane extends Component {

  static propTypes = {
    clientID: PropTypes.string.isRequired,
    model: PropTypes.string.isRequired,
    selectedItems: PropTypes.object.isRequired,
    addSelection: PropTypes.func.isRequired,
    obj: PropTypes.object.isRequired,
    whiteboard: PropTypes.object.isRequired
  }

  constructor(props) {
      super(props);
      this.contents = this.props.obj.contents;
      this.data = this.formTree(); //initial data, needs to be here for filtering (don't make data: this.formTree() in initial data state)
      this.state = {
        data: this.data,
        cursor: null
      };
      this.onToggle = this.onToggle.bind(this);
  }

   /* Need to fix, state being altered somewhere improperly so added this.contents temporarily to compare.
   Should be able to compare prevProps.obj.contents with this.props.obj.contents, but currently not working. */
  componentDidUpdate(prevProps) { // eslint-disable-line no-unused-vars

    if (this.contents !== this.props.obj.contents) {
      this.contents = this.props.obj.contents;
      let tree = this.formTree();
      this.data = tree;
      this.setState({data: tree});
    }
  }



  onToggle(node, toggled) { //node = modified riString
      const { whiteboard, obj, model, clientID, selectedItems, addSelection } = this.props;

      addSelection(model, obj.identifier, node);

      node.active = true;
      if (node.children) node.toggled = toggled;
      const cursorPointer = this.state.cursor;
      this.setState({ cursor: node });
      if (cursorPointer && cursorPointer !== node) cursorPointer.active = false;

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
    const { contents } = this.props.obj;
    if (!contents) return null;
    let jsonTrees = [], //support multiple trees (multiple root levels)
      currentParents = [],
      lastItem = {};
    let treePointer = jsonTrees;

    contents.map(item => {
      if (item.indent) { //if not root (root given no indent)
        if (item.indent > lastItem.indent) { //if child
          currentParents.push(lastItem); //last sibling was a parent
            let lastParentName = currentParents[currentParents.length - 1].name;
            for (let i = 0; i < treePointer.length; i++) {
              if (treePointer[i].name == lastParentName) {
                treePointer = treePointer[i];
                treePointer.children = [];
                treePointer = treePointer.children;
                if (item.color) treePointer.push({name: item.text, header: item.header, color: item.color})
                else treePointer.push({name: item.text, header: item.header});
                break;
              }
            }
        }
        else if (item.indent == lastItem.indent) { //if sibling
          if (item.color) treePointer.push({name: item.text, header: item.header, color: item.color})
          else treePointer.push({name: item.text, header: item.header});
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
          if (item.color) treePointer.push({name: item.text, header: item.header, color: item.color})
          else treePointer.push({name: item.text, header: item.header});
        }
      }
      else { //root
        jsonTrees.push({name: item.text, toggled: true});

        //treePointer pointing to root obj still
      }
      lastItem = {name: item.text, indent: item.indent ? item.indent : 0};
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
    const {obj } = this.props;

    for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
      if (key.includes("Menu")) {
        var menu = key; //var, not let
      }
    }

     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
       return (
         <div styleName='ri-treePane' className="contextMenu shell">
           <ContextMenuTrigger id={obj.identifier}>
             {obj.contents && ( //assume array, no need to check
               <div className='shell'>
                   <input
                     onKeyUp={this.onFilterMouseUp.bind(this)}
                     placeholder="Search..."
                     type="text"/>
                  <Treebeard data={this.state.data} style={TreeStyle} onToggle={this.onToggle} />
               </div>
             )}
           </ContextMenuTrigger>
           <ContextMenu id={obj.identifier}>
             {
               obj[menu].value.map((menuItem, key) => {
                 menuItem && (
                   <MenuItem key={key} onClick={() => this.handleClick(menuItem, obj[menu])}>
                       {menuItem.text}
                   </MenuItem>
                 );
             })
            }
          </ContextMenu>
         </div>
       );
     }
     else if (obj.contents) {
      return <Treebeard styleName='ri-treePane' data={this.state.data} style={TreeStyle} onToggle={this.onToggle} />  //can also set animations={false}, but without it arrows don't change
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
