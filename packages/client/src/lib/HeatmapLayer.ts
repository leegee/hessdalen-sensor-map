import type { Map,View } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import { bbox } from "ol/loadingstrategy";
import { Heatmap as HeatmapLayer } from 'ol/layer';
import type { UfoFeatureCollection } from '../redux/mapSlice';

const vectorSource = new VectorSource({
    format: new GeoJSON(),
    strategy: bbox,
});

export const vectorLayer = new HeatmapLayer({
    source: vectorSource,
    radius: 7,
    blur: 10,
    weight: (feature) => {
        return Number(feature.get('num_points')) + 1;
    },
});

vectorLayer.set('name', 'server-clusters-only');

export function updateVectorLayer(featureCollection: UfoFeatureCollection|null) {
    if (featureCollection) {
        if (featureCollection.features) {
            vectorSource.clear();
            vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
            vectorSource.changed();
            console.debug("Number of features added:", vectorSource.getFeatures().length);
        }
    } else {
        console.debug('No features to add');
    }
} 

export function setupHeatmapListeners(map: Map){
    map.on('moveend', () => updateLayerProperties(map) );
}

function updateLayerProperties(map: Map) {
    const view = map.getView() as View | undefined;
    if (!view) {
        return;
    }
    const zoom: number = view.getZoom() ?? 0;
    const newRadius = zoom >= 6 ? 14 : 5; 
    const newBlur = zoom >= 6 ? 18 : 7; 
    console.log(zoom);
    
    vectorLayer.setBlur(newBlur);
    vectorLayer.setRadius(newRadius);
}
