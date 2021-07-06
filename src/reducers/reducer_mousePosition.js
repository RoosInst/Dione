import { UPDATE_MOUSE_POSITION } from '../actions';

export default function(state = {identifier: null, x:null, y:null}, action) {
  let newState = {};
  switch(action.type) {
    case UPDATE_MOUSE_POSITION:
      Object.assign(newState, state);
      newState.identifier = action.identifier;
      newState.x = action.x;
      newState.y = action.y;
      return newState; 
  }
  return state;
}