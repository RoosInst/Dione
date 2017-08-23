export const SET_LATEST_MESSAGE = 'set_lateset_message';
export const UPDATE_WHITEBOARD = 'update_whiteboard';

export function sendAction(action) {
  return {
    type: action
  }
};

export function setLatestMessage(msg) {
  return {
    type: SET_LATEST_MESSAGE,
    payload: msg
  }
};


export function updateWhiteboard(instructions) {
  return {
    type: UPDATE_WHITEBOARD,
    payload: instructions
  }
};
