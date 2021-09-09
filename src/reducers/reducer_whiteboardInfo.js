
const whiteboardInfoReducerDefaultState = {
    renderOrder: {},
    openApplications: {},
    tabbedApplications: {},
    tabLabels: [],
    layouts: {},
    maxZIndex: 1,
};

const whiteboardInfoReducer = (state = whiteboardInfoReducerDefaultState, action) => {
    switch(action.type) {
        case 'ADD_APPLICATION':
            return {
                ...state,
                renderOrder: {
                    ...state.renderOrder,
                    [action.model]: action.renderOrder
                },
                openApplications: {
                    ...state.openApplications,
                    [action.model]: action.obj
                },
                tabLabels: [
                    ...state.tabLabels,
                    action.model
                ],
                layouts: {
                    ...state.layouts,
                    [action.model]: {
                        x: 10,
                        y: 10,
                        w: 400,
                        h: 400,
                        z: state.maxZIndex
                    }
                },
                maxZIndex: state.maxZIndex + 1,
            };
            
        case 'REMOVE_APPLICATION': {
            const {[action.model]: value, ...openApplications} = state.openApplications;
            const indexOfLabelToRemove = state.tabLabels.indexOf(action.model);
            const tabLabels = state.tabLabels.filter((label, index) => index != indexOfLabelToRemove);
            const {[action.model]: value2, ...layouts} = state.layouts;
            return {
                ...state,
                openApplications,
                tabLabels,
                layouts,
            };
        }

        case 'MINIMIZE_APPLICATION': {
            const {[action.model]: obj, ...openApplications} = state.openApplications;
            return {
                ...state,
                openApplications,
                tabbedApplications: {
                    ...state.tabbedApplications,
                    [action.model]: obj
                }
            };
        }

        case 'UNTAB_APPLICATION': {
            const {[action.model]: obj, ...tabbedApplications} = state.tabbedApplications;
            if(obj) {
                return {
                    ...state,
                    openApplications: {
                        ...state.openApplications,
                        [action.model]: obj
                    },
                    tabbedApplications,
                    layouts: {
                        ...state.layouts,
                        [action.model]: {
                            ...state.layouts[action.model],
                            z: state.maxZIndex
                        }
                    },
                    maxZIndex: state.maxZIndex + 1
                };
            } else {
                return {
                    ...state,
                    layouts: {
                        ...state.layouts,
                        [action.model]: {
                            ...state.layouts[action.model],
                            z: state.maxZIndex
                        }
                    },
                    maxZIndex: state.maxZIndex + 1
                };
            } 
        }

        case 'BEGIN_LAYOUT_UPDATE':
            return {
                ...state,
                layouts: {
                    ...state.layouts,
                    [action.model]: {
                        ...state.layouts[action.model],
                        z: state.maxZIndex
                    }
                },
                maxZIndex: state.maxZIndex + 1
            };

        case 'FINISH_DRAG_LAYOUT_UPDATE':
            return {
                ...state,
                layouts: {
                    ...state.layouts,
                    [action.model]: {
                        ...state.layouts[action.model],
                        x: action.x,
                        y: action.y,
                    }
                }
            };

        case 'FINISH_RESIZE_LAYOUT_UPDATE':
            return {
                ...state,
                layouts: {
                    ...state.layouts,
                    [action.model]: {
                        ...state.layouts[action.model],
                        w: action.w,
                        h: action.h,
                    }
                }
            };

        default: 
            return state;
    }
}

export default whiteboardInfoReducer;