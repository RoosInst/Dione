import { UPDATE_PANE_SIZES } from '../actions';

export default function(state = {}, action) {
  
  switch(action.type) {
    case UPDATE_PANE_SIZES:
      if(action.change == 'update') {
        state[action.model] = {height: action.height, width: action.width};
      } else {
        delete state[action.model];
      }
      
      return state;
  }
  return state;
}