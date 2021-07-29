import { UPDATE_CURRENT_CHANNEL } from '../actions';

export default function(state = '', action) {
  
  switch(action.type) {
    case UPDATE_CURRENT_CHANNEL:
      console.info('updating current channel to: ', action.channel);
      state = action.channel;
      return state;
  }
  return state;
}