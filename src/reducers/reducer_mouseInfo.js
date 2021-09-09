const mouseInfoReducerDefaultState = {
    mousePosition: {
        x: null,
        y: null
    },
    applicationMouseIsOver: '',

};

const mouseInfoReducer = (state = mouseInfoReducerDefaultState, action) => {
    switch(action.type) {
        case 'SHOW_CONTEXT_MENU':
            return {
                ...state,
                mousePosition: {
                    x: action.x,
                    y: action.y
                },
                applicationMouseIsOver: action.identifier
            }

        case 'HIDE_CONTEXT_MENU':
            return {
                ...state,
                mousePosition: {
                    x: null,
                    y: null
                }
            }

        default: 
            return state;
    }
};

export default mouseInfoReducer;