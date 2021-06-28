import {UPDATE_SUBSCRIPTIONS} from '../actions';
export default function(state={}, action) {
    
    switch(action.type) { 
        case UPDATE_SUBSCRIPTIONS: {
            const key = action.key;
            
            if(Object.prototype.hasOwnProperty.call(state, action.key)) {
                if(action.key!="client" && action.key!="cellId") {
                    state.client.unsubscribe(state[key]);
                    console.info("UNSUBSCRIBED FROM " + state[key]);
                    delete state[key];
                }
            } else {
                state[key] = action.topic;
                if(key != "client" && key != "cellId") {     
                    state.client.subscribe(action.topic, {qos: 2});
                    console.info("SUBSCRIBED TO " + action.topic);
                }
            }
            //console.info(state);   USED TO DEBUG, UNCOMMENT TO SEE ALL CHANNELS SUBSCRIBED TO 
        }    
    }
    return state;
}