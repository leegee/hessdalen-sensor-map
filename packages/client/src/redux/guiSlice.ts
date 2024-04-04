import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import config from '@hessdalen-sensor-map/config/src';

export type PanelStateTypes = 'hidden' | 'narrow' | 'full';

export interface GuiSliceType {
    locale: string,
    panel: PanelStateTypes,
    selectionId: string | number | undefined,
    isAnimating: boolean,
}

const initialState: GuiSliceType = {
    locale: config.locale,
    panel: 'hidden',
    selectionId: undefined,
    isAnimating: false,
};

const localeSlice = createSlice({
    name: 'gui',
    initialState,
    reducers: {
        setLocaleKey: (state, action: PayloadAction<string>) => {
            state.locale = action.payload;
        },
        setPanel: (state, action: PayloadAction<PanelStateTypes>) => {
            state.panel = action.payload;
            console.debug(`Set panel to '${state.panel}'`);
            if (state.panel as any === '') {
                console.trace('Set panel received an invalid value');
            }
        },
        setSelectionId: (state, action: PayloadAction<number | undefined>) => {
            state.selectionId = action.payload;
        },
        setIsAnimating: (state, action: PayloadAction<boolean>) => {
            state.isAnimating = action.payload;
        }
    },
});

export const { setIsAnimating, setLocaleKey, setPanel, setSelectionId } = localeSlice.actions;

export default localeSlice.reducer;
