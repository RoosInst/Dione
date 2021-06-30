import { UPDATE_PANE_SIZES } from '../actions';

export default function(state = {MousePosition: {height: null, width: null}}, action) {
  switch(action.type) {
    case UPDATE_PANE_SIZES:
        state[action.model] = {height: action.height, width: action.width};
        console.info(state);
        return state;
  }
  return state;
}