import { combineReducers } from 'redux';

import AppGuru from './reducer_appGuru';
import Auth from './reducer_auth';
import Dashboard from './reducer_dashboard';
import MqttConnection from './reducer_mqttConnection';
import Profile from './reducer_profile';
import Users from './reducer_users';
import ClientID from './reducer_clientID';

const rootReducer = combineReducers({
  appGuru: AppGuru,
  auth: Auth,
  clientID: ClientID,
  dashboard: Dashboard,
  mqttConnection: MqttConnection,
  profile: Profile,
  users: Users
});

export default rootReducer;
  //clientID: "JS" + Math.random().toString(16).substr(2, 6),  //ka mqtt session ID, Return Address (ra)
