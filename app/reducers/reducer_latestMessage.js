import {SET_LATEST_MESSAGE } from '../actions';

export default function(state = null, action) {
  switch(action.type) {
  case SET_LATEST_MESSAGE:
    return action.payload;
  }
  return state;
}
