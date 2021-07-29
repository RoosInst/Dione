import { UPDATE_MOUSE_PRESSED } from '../actions';

export default function(state = {pressed: false}, action) {
  
  switch(action.type) {
    case UPDATE_MOUSE_PRESSED:
      console.info('updating mouse pressed to: ', action.pressed);
      state.pressed = action.pressed;
      return state;
  }
  return state;
}