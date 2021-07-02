import { convertArrayToKeyValues } from '../scripts/functions';
export const UPDATE_WHITEBOARD = 'update_whiteboard';
export const ADD_SELECTION = 'add_selection';
export const UPDATE_CLIENTID = 'update_clientID';
export const MQTT_CONNECTED = 'mqtt_connected';
export const MQTT_DISCONNECTED = 'mqtt_disconnected';
export const MQTT_RECONNECTING = 'mqtt_reconnecting';
export const UPDATE_SUBSCRIPTIONS = 'update_subscriptions';
export const UPDATE_WHITEBOARD_LAYOUT = 'update_whiteboard_layout';
export const UPDATE_ORDER = 'update_order';
export const UPDATE_CONNECTION_DETAILS = 'update_connection_details';
export const UPDATE_PANE_SIZES = 'update_pane_sizes';
export const UPDATE_MOUSE_POSITION = 'update_mouse_position';

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

export function updateMqttSubscriptions(description, new_subscription) {
  return {
      type: UPDATE_SUBSCRIPTIONS, 
      key: description,
      topic: new_subscription
  }
}

export function updateWhiteboardLayout(layout, insertion, model) {
  return {
    type: UPDATE_WHITEBOARD_LAYOUT,
    layout: layout,
    insertion: insertion,
    model: model
  }
}

export function updateRenderOrder(model, order) {
  return {
    type: UPDATE_ORDER,
    model: model, 
    order: order
  }
}

export function updateConnectionDetails(model, details) {
  return {
    type: UPDATE_CONNECTION_DETAILS,
    model: model,
    details: details
  }
}

export function updatePaneSize(model, height, width) {
  return {
    type: UPDATE_PANE_SIZES,
    model: model,
    height: height,
    width: width
  }
}

export function updateMousePosition(identifier, x, y) {
  return {
    type: UPDATE_MOUSE_POSITION,
    identifier: identifier, 
    x: x,
    y: y
  }
}