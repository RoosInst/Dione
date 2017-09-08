import { ADD_SELECTION, UPDATE_WHITEBOARD } from '../actions';

export default function(state = {}, action) {

  var forest = jQuery.extend({}, state);

  switch(action.type) {

    case ADD_SELECTION:
      if (forest[action.model]) {
        forest[action.model][action.identifier] = action.selected;
      }
      else {
        var tree = {};
        tree[action.identifier] = action.selected;
        forest[action.model] = tree;
      }
      return forest;



    case UPDATE_WHITEBOARD: //if list updated, remove replaced selected items
      if (action.payload && action.payload.values && forest[action.model]) { //make sure payload exists (not flat_payload), values is array
        for (var i = 0; i < action.payload.values.length; i++) {
          delete forest[action.model][action.payload.values[i].value];
        }
        return forest;
      } else if (action.payload) { //else delete model from whiteboard
        delete forest[action.model];
        return forest;
      }
  }
  return state;
}
