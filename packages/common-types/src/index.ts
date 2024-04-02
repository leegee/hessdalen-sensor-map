import type { FeatureCollection } from "geojson";

export type AllowedFeatureSourceAttributeType = [
  'norge-ufo' | 'mufon-kaggle' | 'not-specified' | undefined
];

export type FeatureSourceAttributeType = AllowedFeatureSourceAttributeType[0];

export function isFeatureSourceAttributeType(value: any): value is FeatureSourceAttributeType {
  const strValue = String(value);
  return ['norge-ufo', 'mufon-kaggle', 'not-specified', '', undefined].includes(strValue);
}

export interface QueryParams {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  zoom: number;
  to_date?: string | undefined;
  from_date?: string | undefined;
  q?: string;
  q_subject?: string;
  sort_order?: 'ASC' | 'DESC';
  source?: FeatureSourceAttributeType
}

export interface DateTimeMinMax {
  min: number | undefined;
  max: number | undefined;
}

export interface MapDictionary {
  datetime: DateTimeMinMax | undefined;
}

export type QueryResponseType = {
  msg: string;
  status: number;
  dictionary: MapDictionary;
  results: FeatureCollection | undefined;
};

export interface FetchSightingDetailsResponse {
  msg?: string;
  status: number;
  details: SightingRecordType
}

export type SightingRecordType = {
  [key: string]: string | number | undefined | null
}

