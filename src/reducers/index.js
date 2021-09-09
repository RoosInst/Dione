import { combineReducers } from 'redux';

import whiteboardInfo from './reducer_whiteboardInfo';
import connectionInfo from './reducer_connectionInfo';
import mouseInfo from './reducer_mouseInfo';

const rootReducer = combineReducers({
  whiteboardInfo,
  connectionInfo: connectionInfo,
  mouseInfo
})

export default rootReducer;
