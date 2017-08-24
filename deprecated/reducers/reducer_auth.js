export default function(state = false, action) {
  switch(action.type) {
    case 'AUTH':
      return true;

    case 'DEAUTH':
      return false;
  }
  return state;
}
