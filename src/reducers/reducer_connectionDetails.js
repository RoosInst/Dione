import { UPDATE_CONNECTION_DETAILS } from '../actions';

export default function(state = {}, action) {
  switch(action.type) {
    case UPDATE_CONNECTION_DETAILS:
      if(!Object.keys(state).includes(action.model)) {
          state[action.model] = action.details;
      } else {
          delete state[action.model];
      }
      return state;
  }
  return state;
}