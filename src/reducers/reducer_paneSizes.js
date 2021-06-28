import { UPDATE_PANE_SIZES } from '../actions';

export default function(state = {}, action) {
  switch(action.type) {
    case UPDATE_PANE_SIZES:
        state[action.model] = {height: action.height, width: action.width};
        return state;
  }
  return state;
}