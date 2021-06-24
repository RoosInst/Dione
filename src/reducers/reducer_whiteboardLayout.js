import { UPDATE_WHITEBOARD_LAYOUT } from '../actions';

export default function(state = {layouts:{lg: []}}, action) {
  switch(action.type) {
  case UPDATE_WHITEBOARD_LAYOUT:
    if(action.insertion == true ) {
      state.layouts['lg'].push(
        {
          'h': 5,
          'i': action.model,
          'isBounded': undefined,
          'isDraggable': undefined,
          'isResizable': undefined,
          'maxH': undefined,
          'maxW': undefined,
          'minH': undefined,
          'minW': undefined,
          'moved': false,
          'resizeHandles': undefined,
          'static': false,
          'w': 5,
          'x': 0,
          'y': 0
        }
      );
    } else {
       state.layouts.lg = action.layout;
    }
    return state;
  }
  return state;
}