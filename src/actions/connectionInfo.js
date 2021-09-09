export const updateClientId = (clientId) => ({
    type: 'UPDATE_CLIENTID',
    clientId
});

export const updateCellId = (cellId) => ({
    type: 'UPDATE_CELLID',
    cellId
});

export const updateMqttClient = (mqttClient) => ({
    type: 'UPDATE_MQTT_CLIENT',
    mqttClient
});

export const updateMqttConnectionStatus = (mqttConnectionStatus) => ({
    type: 'UPDATE_MQTT_CONNECTION_STATUS',
    mqttConnectionStatus
});

export const addMqttSubscription = (channel, topic) => ({
    type: 'ADD_MQTT_SUBSCRIPTION',
    channel,
    topic
});

export const removeMqttSubscription = (channel) => ({
    type: 'REMOVE_MQTT_SUBSCRIPTION',
    channel
});