export const showContextMenu = (x, y, identifier) => ({
    type: 'SHOW_CONTEXT_MENU',
    x,
    y,
    identifier
});

export const hideContextMenu = () => ({
    type: 'HIDE_CONTEXT_MENU'
});

