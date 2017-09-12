import React from 'react';

import MQTT from '../containers/mqtt';
import Whiteboard from '../containers/whiteboard';

const App = () => {
  return (
		<div id='main'>
				 <MQTT/>
				<Whiteboard />
		</div>
  );
}

export default App;
