import { combineReducers } from 'redux';

import AppGuru from './reducer_appGuru';
import MqttConnection from './reducer_mqttConnection';
import ClientID from './reducer_clientID';
import Whiteboard from './reducer_whiteboard';
import SelectedItems from './reducer_selectedItems';

const rootReducer = combineReducers({
  appGuru: AppGuru,
  clientID: ClientID,
  mqttConnection: MqttConnection,
  whiteboard: Whiteboard,
  selectedItems: SelectedItems
});

export default rootReducer;
