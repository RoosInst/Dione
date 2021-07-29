import { UPDATE_WHITEBOARD_TABS } from '../actions';

export default function(state = {}, action) {
  let newState = {};
  switch(action.type) {
    case UPDATE_WHITEBOARD_TABS:
      Object.assign(newState, state);
      if(Object.keys(newState).includes(action.model)) {
        delete newState[action.model];
      } else {
        newState[action.model] = action.obj;
      }
      return newState;
  }
  return state;
}