// ClusterVectorLayer.ts
import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Cluster from 'ol/source/Cluster';

import { sightingsStyleFunction } from "./map-style";
import type { UfoFeatureCollection } from '../redux/mapSlice';

const CLUSTER_DISTANCE = 40;

const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

const clusterSource = new Cluster({
    distance: CLUSTER_DISTANCE,
    source: vectorSource
});

export const vectorLayer = new VectorLayer({
    source: clusterSource,
    style: sightingsStyleFunction,
});

vectorLayer.set('name', 'clusters');

export function updateVectorLayer(featureCollection: UfoFeatureCollection) {
    vectorSource.clear();
    if ( featureCollection.features) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    }
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}
