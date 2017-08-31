import { combineReducers } from 'redux';

import AppGuru from './reducer_appGuru';
import MqttConnection from './reducer_mqttConnection';
import ClientID from './reducer_clientID';
import Whiteboard from './reducer_whiteboard';

const rootReducer = combineReducers({
  appGuru: AppGuru,
  clientID: ClientID,
  mqttConnection: MqttConnection,
  whiteboard: Whiteboard
});

export default rootReducer;
