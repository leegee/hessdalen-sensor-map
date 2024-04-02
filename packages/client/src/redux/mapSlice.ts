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
import { FeatureSourceAttributeType, MapDictionaryType } from '@hessdalen-sensor-map/common-types';
import type { MapBaseLayerKeyType } from '../Map';
import { RootState } from './store';

export interface GeoJSONFeature {
  id: any;
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, number|string|Date> ;
}

export interface UfoFeatureCollection {
  type: "FeatureCollection";
  clusterCount: number;
  pointsCount: number;
  features: GeoJSONFeature[] | null;
}

export interface FetchFeaturesResposneType {
  results: UfoFeatureCollection;
  dictionary: MapDictionaryType | undefined;
}

// Extend QueryParams 
export interface MapState {
  center: [number, number];
  zoom: number;
  bounds: [number, number, number, number] | null;
  featureCollection: UfoFeatureCollection | null;
  dictionary: MapDictionaryType | undefined;
  from_date?: number;
  to_date?: number;
  q?: string;
  basemapSource: string;
  previousQueryString: string;
  requestingCsv: boolean;
  source: FeatureSourceAttributeType;
}

const searchEndpoint = config.api.host + ':' + config.api.port + config.api.endopoints.search;

const initialState: MapState = {
  featureCollection: null,
  zoom: 5,
  center: config.gui.map.centre,
  bounds: null,
  dictionary: undefined,
  from_date: undefined,
  to_date: undefined,
  q: '',
  basemapSource: localStorage.getItem('basemap_source') ?? 'geo',
  previousQueryString: '',
  requestingCsv: false,
  source: 'not-specified',
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
    setFeatureCollection(state, action: PayloadAction<FetchFeaturesResposneType>) {
      state.featureCollection = (action.payload.results ) ;
      state.dictionary = action.payload.dictionary;
    },
    resetDates(state) {
      state.from_date = undefined;
      state.to_date = undefined;
      console.log('reset dates')
    },
    setFromDate(state, action: PayloadAction<number | undefined>) {
      state.from_date = action.payload;
    },
    setToDate(state, action: PayloadAction<number | undefined>) {
      state.to_date = action.payload;
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
    failedRequest: (state) => {
      state.featureCollection = null;
      state.previousQueryString = '';
      // action.payload.status etc
    },
  },
});

export const {
  setPreviousQueryString, setMapParams,
  resetDates, setFromDate, setToDate,
  setQ, setBasemapSource, setSource,
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { zoom, bounds, from_date, to_date, q, source } = mapState;
  if (!zoom || !bounds) return;

  const queryObject = {
    zoom: String(zoom),
    minlng: String(bounds[0]),
    minlat: String(bounds[1]),
    maxlng: String(bounds[2]),
    maxlat: String(bounds[3]),
    source: String(source),
    ...(from_date !== undefined ? { from_date: String(from_date) } : {}),
    ...(to_date !== undefined ? { to_date: String(to_date) } : {}),
    ...(q !== '' ? { q: q } : {}),
  };

  return new URLSearchParams(queryObject).toString();
};

const _fetchFeatures: any = createAsyncThunk<FetchFeaturesResposneType, any, { state: RootState }>(
  'data/fetchData',
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  async (_, { dispatch, getState }): Promise<FetchFeaturesResposneType|any> => {
    const mapState = getState().map;
    const queryString: string | undefined = selectQueryString(mapState);
    const { previousQueryString } = mapState;

    if (!queryString) return;

    if (previousQueryString === queryString) {
      console.log('fetchFeatures - bail, this request query same as last request query');
      return undefined;
    }
    dispatch(setPreviousQueryString(queryString));

    let response;
    try {
      response = await fetch(`${searchEndpoint}?${queryString}`);
      const data = await response.json() as FetchFeaturesResposneType;
      dispatch(mapSlice.actions.setFeatureCollection(data));
    }
    catch (error) {
      console.error(error);
      dispatch(mapSlice.actions.failedRequest());
    }
  }
);

export const fetchFeatures = debounce(
  _fetchFeatures,
  config.gui.apiRequests.debounceMs,
  { immediate: true }
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

