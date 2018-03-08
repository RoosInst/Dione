import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import Whiteboard from './containers/whiteboard';
import reducers from './reducers';
import './styles/global.scss?global';

ReactDOM.render(
	<Provider store={createStore(reducers, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())}>
    <Whiteboard />
  </Provider>,
	document.getElementById('app')
);

//window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() for browser extension to work for development
