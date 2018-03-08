import { UPDATE_CLIENTID } from '../actions';

export default function(state = "JS" + Math.random().toString(16).substr(2, 6), action) {
  switch(action.type) {
    case UPDATE_CLIENTID:
      return action.payload;
  }
  return state;
}
