export default function(state = false, action) {
  switch(action.type) {
    case 'ADD_APPGURU':
      return true;

    case 'DEL_APPGURU':
      return false;
  }
  return state;
}
