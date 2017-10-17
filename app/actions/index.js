import { convertArrayToKeyValues } from '../scripts/functions';
export const UPDATE_WHITEBOARD = 'update_whiteboard';
export const ADD_SELECTION = 'add_selection';
export const UPDATE_CLIENTID = 'update_clientID';
export const  MQTT_CONNECTED = 'mqtt_connected';
export const MQTT_DISCONNECTED = 'mqtt_disconnected';
export const MQTT_RECONNECTING = 'mqtt_reconnecting';

export function sendAction(action) {
  return {
    type: action
  }
};

export function updateWhiteboard(msg, model) {
  if (Array.isArray(msg)) { //if msg is decodedCborMsg
  return {
    type: UPDATE_WHITEBOARD,
    flat_payload: convertArrayToKeyValues(msg), //flat object, not hierarchical
    model: model
  }
} else {
  return { //if msg is whiteboard object
    type: UPDATE_WHITEBOARD,
    payload: msg,
    model: model
  }
}
};

export function addSelection(model, objID, riString, selectionGroup) {

  return {
    type: ADD_SELECTION,
    model: model,
    identifier: objID,
    selected: riString.text ? riString.text : riString,
    selectionGroup: selectionGroup //undefined unless a radio button
  }
}

export function updateClientID(clientID) {
  return {
    type: UPDATE_CLIENTID,
    payload: clientID
  }
};
