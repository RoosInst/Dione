export const UPDATE_WHITEBOARD = 'update_whiteboard';
export const ADD_SELECTION = 'add_selection';

export function sendAction(action) {
  return {
    type: action
  }
};

export function updateWhiteboard(instructions) {
  return {
    type: UPDATE_WHITEBOARD,
    payload: instructions
  }
};

export function addSelection(objID, riString) {
  return {
    type: ADD_SELECTION,
    identifier: objID,
    selected: riString
  }
}
