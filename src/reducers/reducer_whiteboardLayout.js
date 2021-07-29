import { UPDATE_WHITEBOARD_LAYOUT } from '../actions';

export default function(state = {layouts:{}}, action) {
  
  switch(action.type) {
  case UPDATE_WHITEBOARD_LAYOUT:
    if(action.insertion == true ) {
      if(Object.keys(action.layout).length == 0) {
        if(!Object.keys(state).includes(action.model)) {
          state.layouts[action.model] = 
          {
            'h': 300,
            'w': 300,
            'x': 3,
            'y': 0
          };
        }
      } else {
        state.layouts[action.model] = 
        {
          'h': action.layout.h,
          'w': action.layout.w,
          'x': action.layout.x,
          'y': action.layout.y
        };
        console.info('updating local storage')
        localStorage.setItem('whiteboardLayout', JSON.stringify(state.layouts));
      }
    } else {
      console.info('updating local storage')

       state.layouts = action.layout;
       localStorage.setItem('whiteboardLayout', JSON.stringify(state.layouts));
    }
    console.info('changing layout to: ', state.layouts)
    
    
    return state;
  }
  return state;
}