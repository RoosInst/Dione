import { UPDATE_WHITEBOARD } from '../actions';
import { getStyleAndCreateHierarchy } from '../scripts/functions';

export default function(state = null, action) {
  switch(action.type) {
  case UPDATE_WHITEBOARD:
    return getStyleAndCreateHierarchy(
        action.payload,
         state,
          action.model
      );
    }
  return state;
}
