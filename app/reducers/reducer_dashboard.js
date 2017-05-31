export default function(state = true, action) {
  switch(action.type) {
    case 'ADD_DASHBOARD':
      return true;

    case 'DEL_DASHBOARD':
      return false;
  }
  return state;
}
