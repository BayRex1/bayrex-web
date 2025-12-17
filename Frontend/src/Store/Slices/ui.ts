import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    topPanelHidden: false,
    bottomPanelHidden: false
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // Верхняя панель
        toggleTopPanel: (state) => {
            state.topPanelHidden = !state.topPanelHidden;
        },
        showTopPanel: (state) => {
            state.topPanelHidden = false;
        },
        hideTopPanel: (state) => {
            state.topPanelHidden = true;
        },

        // Нижняя панель
        toggleBottomPanel: (state) => {
            state.bottomPanelHidden = !state.bottomPanelHidden;
        },
        showBottomPanel: (state) => {
            state.bottomPanelHidden = false;
        },
        hideBottomPanel: (state) => {
            state.bottomPanelHidden = true;
        },
    },
});

export const {
    toggleTopPanel,
    showTopPanel,
    hideTopPanel,
    toggleBottomPanel,
    showBottomPanel,
    hideBottomPanel
} = uiSlice.actions;

export default uiSlice.reducer;
