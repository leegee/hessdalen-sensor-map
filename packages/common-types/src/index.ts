// import type { FeatureCollection } from "geojson";

export type AllowedFeatureSourceAttributeType = [
  'norge-ufo' | 'mufon-kaggle' | 'not-specified' | undefined
];

export type FeatureSourceAttributeType = AllowedFeatureSourceAttributeType[0];

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
  dictionary?: MapDictionaryType;
}

export interface DateTimeMinMaxType {
  min: number | undefined;
  max: number | undefined;
}

export interface MapDictionaryType {
  datetime: DateTimeMinMaxType | undefined;
}

export interface QueryParams {
  minlng: number;
  minlat: number;
  maxlng: number;
  maxlat: number;
  zoom: number;
  to_date?: Date | string | number | undefined;
  from_date?: Date | string | number| undefined;
  q?: string;
  q_subject?: string;
  sort_order?: 'ASC' | 'DESC';
  source?: FeatureSourceAttributeType
}

export interface DateTimeMinMax {
  min: number;
  max: number;
}

export type QueryResponseType = {
  msg: string;
  status: number;
  dictionary: MapDictionaryType;
  results: UfoFeatureCollection | undefined;
};

export interface FetchSightingDetailsResponseType {
  msg?: string;
  status: number;
  details: SightingRecordType
}

export type SightingRecordType = {
  [key: string]: string | number | undefined | null
}

