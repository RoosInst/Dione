export default function(state = false, action) {
  switch(action.type) {
  case 'ADD_USERS':
    return true;

  case 'DEL_USERS':
    return false;
  }
  return state;
}
