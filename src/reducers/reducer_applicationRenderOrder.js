import { UPDATE_ORDER } from '../actions';

export default function(state = {}, action) {
  switch(action.type) {
    case UPDATE_ORDER:
        state[action.model] = action.order;
        return state;
  }
  return state;
}