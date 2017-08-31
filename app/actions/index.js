export const SET_LATEST_MESSAGE = 'set_latest_message';
export const UPDATE_WHITEBOARD = 'update_whiteboard';

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
