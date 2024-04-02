// reducers.ts
import { combineReducers } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';
import guiReducer from './guiSlice';
import detailsReducer from './details';

const rootReducer = combineReducers({
  map: mapReducer,
  gui: guiReducer,
  details: detailsReducer,
});

export default rootReducer;
