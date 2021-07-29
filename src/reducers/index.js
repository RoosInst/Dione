import { combineReducers } from 'redux';

import MqttConnection from './reducer_mqttConnection';
import ClientID from './reducer_clientID';
import Whiteboard from './reducer_whiteboard';
import SelectedItems from './reducer_selectedItems';
import Subscriptions from './reducer_subscriptions';
import WhiteboardLayout from './reducer_whiteboardLayout';
import ApplicationRenderOrder from './reducer_applicationRenderOrder';
import ConnectionDetails from './reducer_connectionDetails';
import PaneSize from './reducer_paneSizes';
import MousePosition from './reducer_mousePosition';
import CurrentChannel from './reducer_currentChannel';
import WhiteboardTabs from './reducer_whiteboardTabs';
import MousePressed from './reducer_mousePressed';

const rootReducer = combineReducers({
  clientID: ClientID,
  mqttConnection: MqttConnection,
  whiteboard: Whiteboard,
  selectedItems: SelectedItems,
  subscriptions: Subscriptions,
  whiteboardLayout: WhiteboardLayout,
  renderOrder: ApplicationRenderOrder,
  connectionDetails: ConnectionDetails,
  paneSize: PaneSize,
  mousePosition: MousePosition,
  currentChannel: CurrentChannel,
  whiteboardTabs: WhiteboardTabs,
  mousePressed: MousePressed
});

export default rootReducer;
