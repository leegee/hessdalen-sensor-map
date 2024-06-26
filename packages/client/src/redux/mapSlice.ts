// redux/mapSlice
/**
 * Stores various map parameters that the user can change
 * and/or that we wish to store and/or restore.
 * 
 * Center could be inferred from bounds, but for now is set.
 */

import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import debounce from 'debounce';

import config from '@hessdalen-sensor-map/config/src';
import { UfoFeatureCollection, FetchFeaturesResposneType, FeatureSourceAttributeType, MapDictionaryType } from '@hessdalen-sensor-map/common-types';
import type { MapBaseLayerKeyType } from '../Map';
import { RootState } from './store';

// Extend QueryParams 
export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection: UfoFeatureCollection | null;
  dictionary?: MapDictionaryType;
  from_date: number;
  to_date: number;
  q?: string;
  basemapSource: string;
  previousQueryString: string;
  requestingCsv: boolean;
  runningFeaturesRequest: boolean;
  source: FeatureSourceAttributeType;
  selectedDimensions: DimensionsMapType; 
}

export interface DimensionsMapType {
  mag_x: boolean,
  mag_y: boolean,
  mag_z: boolean,
}

export const DEFAULT_DIMENSIONS: DimensionsMapType = {
  mag_x: true,
  mag_y: true,
  mag_z: true
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoints.search;

const initialState: MapState = {
  featureCollection: null,
  zoom: Number(config.gui.map.initZoom),
  center: config.gui.map.centre,
  bounds: null,
  dictionary: undefined,
  from_date: 0,
  to_date: 0,
  q: '',
  basemapSource: localStorage.getItem('basemap_source') ?? 'geo',
  previousQueryString: '',
  requestingCsv: false,
  runningFeaturesRequest: false,
  source: 'not-specified',
  selectedDimensions: DEFAULT_DIMENSIONS,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapParams(state, action: PayloadAction<{ center: [number, number]; zoom: number; bounds: [number, number, number, number] }>) {
      state.center = action.payload.center;
      state.zoom = action.payload.zoom;
      state.bounds = action.payload.bounds;
    },
    startFeaturesRequest(state) {
      state.runningFeaturesRequest = true;
      console.log('Features request started');
    },
    doneFeaturesRequest(state) {
      state.runningFeaturesRequest = false;
      console.log('Features request done');
    },
    failedFeaturesRequest: (state) => {
      state.featureCollection = null;
      state.previousQueryString = '';
      state.runningFeaturesRequest = false;
    },
    setFeatureCollection(state, action: PayloadAction<FetchFeaturesResposneType>) {
      state.featureCollection = (action.payload.results ) ;
      state.dictionary = action.payload.dictionary;
    },
    resetDates(state) {
      state.from_date = 0;
      state.to_date = 0;
    },
    setFromDate(state, action: PayloadAction<number>) {
      state.from_date = action.payload || 0;
    },
    setToDate(state, action: PayloadAction<number>) {
      state.to_date = action.payload || 0;
    },
    setQ(state, action: PayloadAction<string | undefined>) {
      state.q = action.payload ? action.payload.trim() : '';
    },
    setBasemapSource: (state, action: PayloadAction<MapBaseLayerKeyType>) => {
      state.basemapSource = action.payload;
      localStorage.setItem('basemap_source', state.basemapSource);
    },
    setSource: (state, action: PayloadAction<FeatureSourceAttributeType>) => {
      state.source = action.payload;
    },
    setPreviousQueryString: (state, action: PayloadAction<string>) => {
      state.previousQueryString = action.payload;
    },
    setCsvRequesting: (state) => {
      state.requestingCsv = true;
    },
    csvRequestDone: (state) => {
      state.requestingCsv = false;
    },
    csvRequestFailed: (state) => {
      state.requestingCsv = false;
    },
    setSelectedDimensions: (state, action: PayloadAction<DimensionsMapType>) => {
      state.selectedDimensions = { ...action.payload };
    },
  },
});

export const {
  setPreviousQueryString, setMapParams,
  resetDates, setFromDate, setToDate,
  setQ, setBasemapSource, setSource,
  setSelectedDimensions,
} = mapSlice.actions;

export const selectBasemapSource = (state: RootState) => state.map.basemapSource as MapBaseLayerKeyType;

export const selectPointsCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection) => featureCollection?.pointsCount ?? 0
);

export const selectClusterCount = createSelector(
  (state: RootState) => state.map.featureCollection,
  (featureCollection) => featureCollection?.clusterCount ?? 0
);

export const selectQueryString = (mapState: MapState): string | undefined => {
  const { zoom, bounds, from_date, to_date } = mapState;
  if (!zoom || !bounds) {
    return;
  }

  const queryObject = {
    zoom: String(zoom),
    minlng: String(bounds[0]),
    minlat: String(bounds[1]),
    maxlng: String(bounds[2]),
    maxlat: String(bounds[3]),
    ...(from_date !== 0 ? { from_date: String(from_date) } : {}),
    ...(to_date !== 0 ? { to_date: String(to_date) } : {}),
  };

  return new URLSearchParams(queryObject).toString();
};

export const fetchFeatures: any = createAsyncThunk<FetchFeaturesResposneType, any, { state: RootState }>(
  'data/fetchData',
   // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async (_, { dispatch, getState }): Promise<FetchFeaturesResposneType|any> => { 
    const mapState = getState().map;
    console.debug('fetchFeatures - enter');

    if (mapState.runningFeaturesRequest) {
      console.debug('fetchFeatures already running, bail');
      return;
    }

    const queryString: string | undefined = selectQueryString(mapState);
    
    // API requires a query
    if (!queryString) {
      console.debug('fetchFeatures - no query string');
      return;
    }

    if (mapState.previousQueryString === queryString) {
      console.log('fetchFeatures - bail, this request query same as last request query');
      return undefined;
    }

    // Finally, commiting to sending a request
    dispatch(mapSlice.actions.startFeaturesRequest());

    dispatch(setPreviousQueryString(queryString));

    console.debug('fetchFeatures - fetch');

    let response;

    try {
      response = await fetch(`${searchEndpoint}?${queryString}`);
      const data = await response.json() as FetchFeaturesResposneType;
      console.log('Features request: HTTP ', response.ok? response.status + '/OK' : 'error/'+ response.status);
      dispatch(mapSlice.actions.setFeatureCollection(data));
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.failedFeaturesRequest());
    }
    finally {
      dispatch(mapSlice.actions.doneFeaturesRequest());
    }
  }
);


export const _fetchCsv: any = createAsyncThunk<any, any, { state: RootState }>(
  'data/fetchData',
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async (_, { dispatch, getState }): Promise<FetchFeaturesResposneType | any> => {
    const mapState = getState().map;

    dispatch(mapSlice.actions.setCsvRequesting());

    const queryString: string | undefined = selectQueryString(mapState);

    const requestOptions = {
      headers: {
        accept: 'text/csv',
      }
    };

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`, requestOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Expose the CSV
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'data.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(mapSlice.actions.csvRequestDone());
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.csvRequestFailed());
    }
  }
);

export const fetchCsv = debounce(
  _fetchCsv,
  config.gui.apiRequests.debounceMs * 10,
  { immediate: true }
);

export default mapSlice.reducer;

