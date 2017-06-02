//clientID: "JS" + Math.random().toString(16).substr(2, 6),  //ka mqtt session ID, Return Address (ra)
export default function(state = "JS" + Math.random().toString(16).substr(2, 6), action) {
  switch(action.type) {
    case 'NEW_ID':
      return "JS" + Math.random().toString(16).substr(2, 6);
  }
  return state;
}
