// VectorLayer.ts

import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import type { UfoFeatureCollectionType } from '@ufo-monorepo-test/common-types';
import type { StyleFunction } from "ol/style/Style";
import { type Map, Overlay, Feature } from "ol";
import { sightingsStyleFunction } from "./map-style";

const vectorSource = new VectorSource({
    strategy: bbox,
    format: new GeoJSON(),
});

export const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: sightingsStyleFunction as StyleFunction,
});

vectorLayer.set('name', 'points');


// Array to store references to the overlays
const overlays: Overlay[] = [];

export function updateVectorLayer(featureCollection: UfoFeatureCollectionType, map: Map) {
    vectorSource.clear();
    vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);

    // Remove previous overlays
    overlays.forEach((overlay) => {
        map.removeOverlay(overlay);
    });
    overlays.length = 0;

    // Loop through the features and create an overlay for each feature
    vectorSource.getFeatures().forEach((feature: Feature) => {
        const properties = feature.getProperties();

        // Create overlay content inline
        const overlayContent = `
            <div class="ol-overlay" style='font-size: 8pt; background: black'>
                <div>Mag X ${properties.mag_x}</div>
                <div>Mag Y ${properties.mag_y}</div>
                <div>Mag Z ${properties.mag_z}</div>
            </div>
        `;

        const element:  HTMLDivElement = document.createElement('div');
        element.innerHTML = overlayContent;

        const overlay = new Overlay({
            element,
            positioning: 'bottom-center',
            offset: [0, 70],
        });

        // Add the overlay to the map
        map.addOverlay(overlay);
        overlays.push(overlay);

        // Set the position of the overlay
        const coordinates = feature.getGeometry()?.getCoordinates();
        overlay.setPosition(coordinates);
    });
}
