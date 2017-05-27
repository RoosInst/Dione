export default function(state = false, action) {
  switch(action.type) {
    case 'ADD_DASHBOARD':
      return true;

    case 'DEL_DASHBOARD':
      return false;
  }
  return state;
}
