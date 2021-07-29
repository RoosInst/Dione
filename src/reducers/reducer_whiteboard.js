import { UPDATE_WHITEBOARD } from '../actions';
import { getStyleAndCreateHierarchy } from '../scripts/functions';

export default function(state = null, action) {
  switch(action.type) {
  case UPDATE_WHITEBOARD:
    if (action.flat_payload){
      let newState = getStyleAndCreateHierarchy(action.flat_payload, state, action.model);
      localStorage.setItem('whiteboard', JSON.stringify(newState));
      return newState;
    } 
    else {
      localStorage.setItem('whiteboard', JSON.stringify(action.payload));
      return action.payload;
    } 
  }
  return state;
}
