import { combineReducers } from 'redux';

import MqttConnection from './reducer_mqttConnection';
import ClientID from './reducer_clientID';
import Whiteboard from './reducer_whiteboard';
import SelectedItems from './reducer_selectedItems';
import Subscriptions from './reducer_subscriptions';

const rootReducer = combineReducers({
  clientID: ClientID,
  mqttConnection: MqttConnection,
  whiteboard: Whiteboard,
  selectedItems: SelectedItems,
  subscriptions: Subscriptions
});

export default rootReducer;
