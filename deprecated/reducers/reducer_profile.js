export default function(state = false, action) {
  switch(action.type) {
  case 'ADD_PROFILE':
    return true;

  case 'DEL_PROFILE':
    return false;
  }
  return state;
}
