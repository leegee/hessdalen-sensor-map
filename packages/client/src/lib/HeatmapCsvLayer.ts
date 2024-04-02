import type { Map, View } from 'ol';
import { Heatmap as HeatmapLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import Papa from 'papaparse';
import { UfoFeatureCollection } from '../redux/mapSlice';

const vectorSource = new VectorSource({
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

export function updateVectorLayer(csvData: string) {
    console.log(csvData)
    Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        complete: (results: Papa.ParseResult<{ id: string, lon: string, lat: string, num_points: string }>) => {
            const features = results.data.map((row) => {
                const feature = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(row.lon), parseFloat(row.lat)],
                    },
                    properties: {
                        num_points: parseFloat(row.num_points),
                    },
                };
                return feature;
            });
            vectorSource.clear();
            vectorSource.addFeatures(new GeoJSON().readFeatures({ type: 'FeatureCollection', features }));
            vectorSource.changed();
            console.debug("Number of features added:", vectorSource.getFeatures().length);
        },
    });
}


export function setupHeatmapListeners(map: Map){
    map.on('moveend', () => updateLayerProperties(map));
}

function updateLayerProperties(map: Map) {
    const view = map.getView() as View | undefined;
    if (!view) {
        return;
    }
    const zoom: number = view.getZoom() ?? 0;
    const newRadius = zoom >= 6 ? 14 : 5; 
    const newBlur = zoom >= 6 ? 18 : 7; 

    vectorLayer.setBlur(newBlur);
    vectorLayer.setRadius(newRadius);
}
