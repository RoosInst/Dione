import { convertArrayToKeyValues } from '../scripts/functions';
export const UPDATE_WHITEBOARD = 'update_whiteboard';
export const ADD_SELECTION = 'add_selection';

export function sendAction(action) {
  return {
    type: action
  }
};

export function updateWhiteboard(decodedCborMsg, model) {
  return {
    type: UPDATE_WHITEBOARD,
    payload: convertArrayToKeyValues(decodedCborMsg),
    model: model
  }
};

export function addSelection(model, objID, riString) {
  return {
    type: ADD_SELECTION,
    model: model,
    identifier: objID,
    selected: riString
  }
}
