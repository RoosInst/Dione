import { convertArrayToKeyValues } from '../scripts/functions';
export const UPDATE_WHITEBOARD = 'update_whiteboard';
export const ADD_SELECTION = 'add_selection';
export const UPDATE_CLIENTID = 'update_clientID';
export const  MQTT_CONNECTED = 'mqtt_connected';
export const MQTT_DISCONNECTED = 'mqtt_disconnected';
export const MQTT_RECONNECTING = 'mqtt_reconnecting';

export function sendAction(action) { //generic send action to reducers (used for MQTT consts instead of writing 3 actions that do same thing (return self))
  return {
    type: action
  }
}

export function updateWhiteboard(msg, model) {
  if (Array.isArray(msg)) { //if msg is decodedCborMsg
    return {
      type: UPDATE_WHITEBOARD,
      flat_payload: convertArrayToKeyValues(msg), //flat object, not hierarchical
      model: model
    }
  }
  else {
    return { //if msg is whiteboard object
      type: UPDATE_WHITEBOARD,
      payload: msg,
      model: model
    }
  }
}

export function addSelection(model, objID, contents, selectionGroup) {

  return {
    type: ADD_SELECTION,
    model: model,
    identifier: objID,
    selected: Array.isArray(contents) ? contents[0] : contents, //should be array (contents always inside array) if single entity (like button), but only riString if multiple entities (like ListPane)
    selectionGroup: selectionGroup //undefined unless a radio button
  }
}

export function updateClientID(clientID) {
  return {
    type: UPDATE_CLIENTID,
    payload: clientID
  }
}
