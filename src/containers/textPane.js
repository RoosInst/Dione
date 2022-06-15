import React, {Component, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { showContextMenu } from '../actions/mouseInfo';
import { addSelectedItem, removeSelectedItem } from '../actions/whiteboardInfo';

import { sendSelectionMsg } from '../scripts/functions';

import eol from 'eol'; //some line endings inconsistent (CR with CRLF)
import PropTypes from 'prop-types';
import ContextMenus from './ContextMenus';
//import { mqttClient, cellID } from '../containers/mqtt';
import { mqttClient } from './Mqtt';
import { white } from 'material-ui/styles/colors';
const RtCbor = require('../scripts/RtCbor');
let rtCbor = new RtCbor();


const handleClick = (event, props) => {
  const {obj, showContextMenu} = props;
  event.preventDefault();
  let mouseX = event.clientX;
  let mouseY = event.clientY;
  showContextMenu(mouseX, mouseY, obj.identifier);
}

const onClick = (obj, selectedItem, props) => {
  const { addSelectedItem, channel, cellId, model, allSelectedItems } = props;
  let updatedSelectedItems = {
    ...allSelectedItems,
    [`selection${obj.identifier}`]: selectedItem
  };
  
  sendSelectionMsg(model, obj, cellId, channel, selectedItem, updatedSelectedItems, null);

  addSelectedItem(`selection${obj.identifier}`, selectedItem);
}

const Pane = (props) => {
  const { obj, model, currentSelection, removeSelectedItem } = props;
  //console.info('TEXT PANE RERENDERED');
  //console.info("OBJ: ", obj);

  const [empty, causeRerender ] = useState("");
  const content = useRef(" ");

  //console.info(`${obj.identifier} COUNT: `, count.current); 

  //Monitors to see if message applies to this pane
  useEffect(() => {
    mqttClient.on("message", (topic, message) => {
    
      let decodedCborMsgs = rtCbor.decodeAll(message);
     
        
      if(decodedCborMsgs[0][0].value == obj.identifier) {
        decodedCborMsgs[0].every((element, index) => {
          if(element == "contents") {
            console.info("CHANGING THE CONTENT");
            content.current = decodedCborMsgs[0][index+1];
            removeSelectedItem(`selection${obj.identifier}`);
            return false;
          } else {
            return true;
          }
        });
        // console.info("CURRENT SELECTED ITEM: ", allSelectedItems[`selection${obj.identifier}`]);
        // console.info(allSelectedItems);
        // if(allSelectedItems[`selection${obj.identifier}`] != undefined) {
        //   console.info("TRYING TO REMOVE SELECTED ITEM");
        //   removeSelectedItem(`selection${obj.identifier}`);
        // } else {
          causeRerender({ causingRerender: "" });
        
        //console.info(obj.identifier);
      }
    });
  }, []);

    
  

  for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
    if (key.includes("Menu")) {
      var menu = key; //var, not let
    }
  }

  
  //if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities

    return (
      <div style={obj.style} id={model + '_' + obj.identifier} key={model + '_' + obj.identifier} onContextMenu={(event) => handleClick(event, props)}>
        { menu != undefined ? <ContextMenus fullMenu={obj[menu]} model={model} identifier={obj.identifier}/> : null } 
        {
          content.current != " " ? 
            <div style={{height:"100%", overflowY: "auto"}}> 
              {
                content.current.map(element => {
                  let styles;
                  if(currentSelection == element) {
                    styles = { marginTop: 0, marginBottom: 0, color: "white", backgroundColor: "blue" };
                  } else {
                    styles = { marginTop: 0, marginBottom: 0 };
                  }

                  return (
                    <p key={element} style={styles} onClick={() => onClick(obj, element, props)}>
                      {element}
                    </p>
                  );
                })
              }
            </div>
          :
            obj.contents && obj.contents[0] ?
              Array.isArray(obj.contents) && obj.contents[0].highlight ? //if highlight exists, then assuming array will only be length 1 (contents[0]). contents[0] sometimes undefined, so check
              <pre>
                {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
                <span className='highlight'>
                  {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
                </span>
                {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
              </pre>
            : //no highlight
              <pre>{eol.lf(obj.contents[0].text)}</pre>
            : <span style={{whiteSpace: 'pre'}} />
        }
      </div>  
    );
 // }
  // else if (obj.contents) {
  //   return (<span style={{whiteSpace: 'pre'}}>{eol.lf(obj.contents[0].text)}</span>);
  // }
  // else return null; //else no obj.contents

}


// class Pane extends Component {
//   static propTypes = {
//     model: PropTypes.string.isRequired,
//     obj: PropTypes.object.isRequired,
//   }

//   handleClick(event) {
//     const {obj, showContextMenu} = this.props;
//     event.preventDefault();
//     let mouseX = event.clientX;
//     let mouseY = event.clientY;
//     showContextMenu(mouseX, mouseY, obj.identifier);
//   }

//   monitorMessages = (mqttClient, identifier) => {
//     console.info("IN THE MONITOR MESSAGE FUNCTION");
//     mqttClient.on("message", (topic, message) => {
      
//       let decodedCborMsgs = rtCbor.decodeAll(message);
//       console.info(decodedCborMsgs[0][0].value);
      
//       if(decodedCborMsgs[0][0].value == identifier) {
//         console.info("MESSAGE FOR: " + identifier + "\n" + decodedCborMsgs);
//       }
//     })
//   }

// 	render() {
//     const { obj, model } = this.props;
//     for (let key in obj) { //Check for "*Menu" obj inside current obj, ex. wbMenu, textMenu. Will be used for right click context menu
//       if (key.includes("Menu")) {
//         var menu = key; //var, not let
//       }
//     }

//     this.monitorMessages(mqttClient, obj.identifier);


//     console.info("OBJ: ", obj);
//     if (obj.identifier && menu && obj[menu].value) { //if right-clicking capabilities
//       return (
//         <div style={obj.style} id={model + '_' + obj.identifier} key={model + '_' + obj.identifier} onContextMenu={(event) => this.handleClick(event)}>
//           <ContextMenus fullMenu={obj[menu]} model={model} identifier={obj.identifier}/>
//           {
//             obj.contents && obj.contents[0] ?
//               Array.isArray(obj.contents) && obj.contents[0].highlight ? //if highlight exists, then assuming array will only be length 1 (contents[0]). contents[0] sometimes undefined, so check
//               <pre>
//                 {obj.contents[0].text.substring(0, obj.contents[0].highlight[0] - 1)}
//                 <span className='highlight'>
//                   {obj.contents[0].text.substring(obj.contents[0].highlight[0] - 1, obj.contents[0].highlight[1] - 1)}
//                 </span>
//                 {obj.contents[0].text.substring(obj.contents[0].highlight[1] - 1)}
//               </pre>
//             : //no highlight
//               <pre>{eol.lf(obj.contents[0].text)}</pre>
//             : <span style={{whiteSpace: 'pre'}} />
//           }
//         </div>  
//       );
//     }
//     else if (obj.contents) {
//       return (<span style={{whiteSpace: 'pre'}}>{eol.lf(obj.contents[0].text)}</span>);
//     }
//     else return null; //else no obj.contents

// 	}
// }

const mapStateToProps = (state, ownProps) => {
  const { obj, model } = ownProps;

  return {
    currentSelection: state.whiteboardInfo.selectedItems[`selection${obj.identifier}`],
    allSelectedItems: state.whiteboardInfo.selectedItems,
    channel: state.connectionInfo.whiteboardChannels[model],
    cellId: state.connectionInfo.cellId
  }
}

export default connect(mapStateToProps, { showContextMenu, addSelectedItem, removeSelectedItem })(Pane);
