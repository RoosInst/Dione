import {SET_LATEST_MESSAGE } from '../actions';

export default function(state = null, action) {
  switch(action.type) {
  case SET_LATEST_MESSAGE:
    var newState = {};
    newState['model'] = action.model;
    newState['payload'] = action.payload;
    return newState;
  }
  return state;
}
