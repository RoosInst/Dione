import {UPDATE_WHITEBOARD } from '../actions';

export default function(state = null, action) {
  switch(action.type) {
  case UPDATE_WHITEBOARD:
    return action.payload;
  }
  return state;
}
