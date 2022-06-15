export const addApplication = (renderOrder, model, obj) => ({
    type: 'ADD_APPLICATION',
    renderOrder,
    model,
    obj
});

export const removeApplication = (model) => ({
    type: 'REMOVE_APPLICATION',
    model
});

export const minimizeApplication = (model) => ({
    type: 'MINIMIZE_APPLICATION',
    model
});

export const untabApplication = (model) => ({
    type: 'UNTAB_APPLICATION',
    model,
});

export const beginLayoutUdpdate = (model) => ({
    type: 'BEGIN_LAYOUT_UPDATE',
    model
});

export const finishDragLayoutUdpdate = (model, x, y) => ({
    type: 'FINISH_DRAG_LAYOUT_UPDATE',
    model,
    x,
    y
});

export const finishResizeLayoutUdpdate = (model, w, h) => ({
    type: 'FINISH_RESIZE_LAYOUT_UPDATE',
    model,
    w,
    h
});

export const saveCurrentSession = () => ({
    type: 'SAVE_CURRENT_SESSION'
})

export const addSelectedItem = (pane, selectedItem) => ({
    type: 'ADD_SELECTED_ITEM',
    pane,
    selectedItem
});

export const removeSelectedItem = (pane) => ({
    type: 'REMOVE_SELECTED_ITEM',
    pane
});