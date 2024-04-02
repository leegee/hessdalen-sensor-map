import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FetchSightingDetailsResponseType, SightingRecordType } from '@hessdalen-sensor-map/common-types';
import config from '@hessdalen-sensor-map/config/src';

export interface SightingDetailsState {
    id: string | undefined;
    loading: boolean;
    error: string | null;
    details: SightingRecordType
    // Add other fields as needed
}

const detailsEndpoint = config.api.host + ':' + config.api.port + config.api.endopoints.details;

const initialState: SightingDetailsState = {
    id: undefined,
    loading: false,
    error: null,
    details: {}
};

export const fetchSightingDetails: any = createAsyncThunk<
    FetchSightingDetailsResponseType,
    string, // Type of the id param
    { rejectValue: string | Error }
>(
    'sightingDetails/fetchSightingDetails',
    async (id: string, thunkAPI) => {
        try {
            const response = await fetch(`${detailsEndpoint}/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return await response.json();
        }
        catch (error) {
            return thunkAPI.rejectWithValue((error as Error).message);
        }
    }
);

const detailsSlice = createSlice({
    name: 'sightingDetails',
    initialState,
    reducers: {
        setId: (state, action: PayloadAction<string|undefined>) => {
            state.id = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSightingDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSightingDetails.fulfilled, (state, action: PayloadAction<Record<string, any>>) => {
                state.loading = false;
                state.details = action.payload.details as SightingRecordType;
            })
            .addCase(fetchSightingDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setId } = detailsSlice.actions;

export default detailsSlice.reducer;
