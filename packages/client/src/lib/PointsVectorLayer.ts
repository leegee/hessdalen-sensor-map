// VectorLayer.ts

import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleFunction } from "ol/style/Style";
import { type Map, Overlay, type Feature } from "ol";
import { sightingsStyleFunction } from "./map-style";
import type {  SimpleGeometry } from "ol/geom";

import type { UfoFeatureCollectionType } from '@ufo-monorepo-test/common-types';

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

    // addTables();
    addRings(map);
}

function addTables(map: Map) {
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
            setOverlayToFeaturePosition(overlay, feature);
        });
}

function setOverlayToFeaturePosition(overlay: Overlay, feature: Feature) {
    const geom = feature.getGeometry();
    if (geom) {
        const coordinates = (geom as SimpleGeometry).getCoordinates();
        if (coordinates) {
            overlay.setPosition(coordinates);
        }
    }
}

function createRingSVG(values: Record<string, number>) {
    const width = 2;
    const innerRadius = 4;
    const outerRadius = (width * Object.keys(values).length) + innerRadius;

    // Create an array of keys from the values object
    const keys = Object.keys(values);

    // Calculate the stroke-dasharray and color for each inner ring based on the values
    const circles = keys.map((key, index) => {
        const circleRadius = innerRadius + (index * width); // Adjust the radius based on the index
        const dashArray = (2 * Math.PI * circleRadius * values[key]) + ' ' + (2 * Math.PI * circleRadius);
        return `<circle 
                cx="50%" cy="50%" 
                class='${key}' 
                r="${circleRadius}" 
                stroke-width="${width}"
                 stroke-dasharray="${dashArray}"/>`;
    }).join('\n');
    
    // Create the SVG string
    const svgContent = `
        <svg width="${outerRadius * 2}" height="${outerRadius * 2}" xmlns="http://www.w3.org/2000/svg">
            ${circles}
        </svg>
    `;

    return svgContent;
}


function addRings(map: Map) {
    vectorSource.getFeatures().forEach((feature: Feature) => {
        const properties = feature.getProperties();
        const svgContent = createRingSVG(  {
            mag_x: Number(properties.mag_x),
            mag_y: Number(properties.mag_y),
            mag_z: Number(properties.mag_z),
        }); 
        // const svgImage = new Image();
        // svgImage.src = 'data:image/svg+xml,' + encodeURIComponent(svgContent);
        const svgElement: HTMLElement = document.createElement('svg');
        svgElement.innerHTML = svgContent;
        const overlay = new Overlay({
            offset: [0, 3],
            positioning: 'center-center',
            element: svgElement // svgImage
        });
        setOverlayToFeaturePosition(overlay, feature);
        map.addOverlay(overlay);

    });
}