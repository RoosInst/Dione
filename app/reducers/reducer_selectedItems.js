import { ADD_SELECTION } from '../actions';

export default function(state = {}, action) {
  switch(action.type) {
    case ADD_SELECTION:
      var newState = jQuery.extend({}, state);
      newState[action.identifier] = action.selected;
      return newState;
  }
  return state;
}
