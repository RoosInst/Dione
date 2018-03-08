import { ADD_SELECTION, UPDATE_WHITEBOARD } from '../actions';

export default function(state = {}, action) {

  var forest = $.extend({}, state);

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
      if (action.selectionGroup) { //if radio button, need to replace previously selected button
        for (var i = 0; i < action.selectionGroup.length; i++) {
          delete forest[action.model][action.selectionGroup[i]]; //if doesn't exist, it silently ignores which is OK. No need for check if exists
        }
      }
      return forest;



    case UPDATE_WHITEBOARD: //if list updated, remove replaced selected items

      // if (action.payload && action.payload.values && forest[action.model]) { //make sure payload exists (not flat_payload), values is array
      //   for (var i = 0; i < action.payload.values.length; i++) {
      //     delete forest[action.model][action.payload.values[i].value];
      //   }
      //   return forest;
      // }
      //else if
      if (action.payload && !action.payload[action.model]) { //else delete model from selectedItems because no longer exists in wb
        delete forest[action.model];
        return forest;
      }
  }
  return state;
}
