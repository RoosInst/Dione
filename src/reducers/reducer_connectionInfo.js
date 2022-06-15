const connectionReducerDefaultState = {
    clientId: "JS" + Math.random().toString(16).substr(2, 6),
    cellId: '',
    mqttClient: {},
    mqttConnectionStatus: 'disconnected',
    mqttSubscriptions: {},
    whiteboardChannels: {}
} 

const connectionInfoReducer = (state = connectionReducerDefaultState, action) => {
    switch(action.type) {
        case 'UPDATE_CLIENTID':
            return {
                ...state,
                clientId: action.clientId
            };

        case 'UPDATE_CELLID':
            return {
                ...state,
                cellId: action.cellId
            };

        case 'UPDATE_MQTT_CLIENT':
            return {
                ...state,
                mqttClient: action.mqttClient
            };

        case 'UPDATE_MQTT_CONNECTION_STATUS':
            return {
                ...state,
                mqttConnectionStatus: action.mqttConnectionStatus
            };

        case 'ADD_MQTT_SUBSCRIPTION':
            return {
                ...state,
                mqttSubscriptions: {
                    ...state.mqttSubscriptions,
                    [action.channel]: action.topic
                }
            };
         
        case 'REMOVE_MQTT_SUBSCRIPTION': {
            const {[action.channel]: value, ...mqttSubscriptions} = state.mqttSubscriptions;
            return {
                ...state,
                mqttSubscriptions
            };
        }

        case 'ADD_WHITEBOARD_CHANNEL': 
            return {
                ...state,
                whiteboardChannels: {
                    ...state.whiteboardChannels,
                    [action.model]: action.channel
                }
            };
          
        default: 
            return state;
    }
}

export default connectionInfoReducer;