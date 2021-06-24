import { combineReducers } from 'redux';

import MqttConnection from './reducer_mqttConnection';
import ClientID from './reducer_clientID';
import Whiteboard from './reducer_whiteboard';
import SelectedItems from './reducer_selectedItems';
import Subscriptions from './reducer_subscriptions';
import WhiteboardLayout from './reducer_whiteboardLayout';

const rootReducer = combineReducers({
  clientID: ClientID,
  mqttConnection: MqttConnection,
  whiteboard: Whiteboard,
  selectedItems: SelectedItems,
  subscriptions: Subscriptions,
  whiteboardLayout: WhiteboardLayout
});

export default rootReducer;
