import { UPDATE_WHITEBOARD } from '../actions';
import { getStyleAndCreateHierarchy } from '../scripts/functions';

export default function(state = null, action) {
  switch(action.type) {
  case UPDATE_WHITEBOARD:
    if (action.flat_payload) {
    return getStyleAndCreateHierarchy(
        action.flat_payload,
         state,
          action.model
      );
    } else return action.payload;
  }
  return state;
}
