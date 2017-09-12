import { MQTT_CONNECTED, MQTT_DISCONNECTED, MQTT_RECONNECTING } from '../actions';

export default function(state = 'disconnected', action) {
  switch(action.type) {
  case MQTT_CONNECTED:
    return 'connected';

  case MQTT_DISCONNECTED:
    return 'disconnected';

  case MQTT_RECONNECTING:
    return 'reconnecting';
  }
  return state;
}
