import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import config from '@hessdalen-sensor-map/config/src';

export type PanelStateTypes = 'hidden' | 'narrow' | 'full';

export interface GuiSliceType {
    locale: string,
    panel: PanelStateTypes,
    selectionId: string | number | undefined,
}

const initialState: GuiSliceType = {
    locale: config.locale,
    panel: 'hidden',
    selectionId: undefined
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
    },
});

export const { setLocaleKey, setPanel, setSelectionId } = localeSlice.actions;

export default localeSlice.reducer;
