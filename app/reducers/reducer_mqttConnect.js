export default function(state = false, action) {
  switch(action.type) {
  case 'ADD_MQTTCONNECT':
    return true;

  case 'DEL_MQTTCONNECT':
    return false;
  }
  return state;
}
