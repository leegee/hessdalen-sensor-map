// VectorLayer.ts

import { bbox } from "ol/loadingstrategy";
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleFunction } from "ol/style/Style";
import { type Map, Overlay, type Feature } from "ol";
import { sightingsStyleFunction } from "./map-style";
import type { SimpleGeometry } from "ol/geom";

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
    // Remove previous overlays
    overlays.forEach((overlay) => {
        map.removeOverlay(overlay);
        overlay.dispose();
    });
    console.log('Number of overlays removed:', overlays.length);
    overlays.length = 0;

    if (featureCollection.features) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
        console.debug("Number of features added:", vectorSource.getFeatures().length);
    } else {
        console.debug("No of features added");
    }

    // addTables();
    addRings(map);
    vectorSource.changed();
}


function _setOverlayToFeaturePosition(overlay: Overlay, feature: Feature) {
    const geom = feature.getGeometry();
    if (geom) {
        const coordinates = (geom as SimpleGeometry).getCoordinates();
        if (coordinates) {
            overlay.setPosition(coordinates);
        }
    }
}

function _createThreeRingSVG(values: Record<string, number>) {
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
        const svgContent = _createThreeRingSVG({ // _createRingSVG
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
        _setOverlayToFeaturePosition(overlay, feature);
        map.addOverlay(overlay);
        overlays.push(overlay);
    });

    console.log('Overlays added:,', overlays.length);
}

/*
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

        const element: HTMLDivElement = document.createElement('div');
        element.innerHTML = overlayContent;

        const overlay = new Overlay({
            element,
            positioning: 'bottom-center',
            offset: [0, 70],
        });

        // Add the overlay to the map
        map.addOverlay(overlay);
        // Store to later remove
        overlays.push(overlay);
        console.log('Overlays added:', overlays.length);

        // Set the position of the overlay
        _setOverlayToFeaturePosition(overlay, feature);
    });
}
*/

/*
function _createRingSVG(values: Record<string, number>) {
    const keys = Object.keys(values);
    const innerRadius = 8;

    let startAngle = 0;
    
    const segments = keys.map((key, index) => {
        const segmentValue = values[key];
        const segmentAngle = 360 / keys.length; // Equally portioned segment angle
        const endAngle = startAngle + segmentAngle;
    
        const startX = 50 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
        const startY = 50 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
        const endX = 50 + innerRadius * Math.cos((endAngle * Math.PI) / 180);
        const endY = 50 + innerRadius * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    
        // Calculate stroke length proportional to the value
        const strokeLength = segmentValue * 2 * Math.PI * innerRadius;
        
        const path = `
            <path 
                d="M 50 50 L ${startX} ${startY} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z" 
                class="pie ${key}"
                stroke="${key}"
                stroke-dasharray="${strokeLength} ${2 * Math.PI * innerRadius}"
            />
        `;
    
        startAngle = endAngle; // Update startAngle for the next segment
        return path;
    }).join('\n');
    
    // Combine the paths into a single SVG circle
    const svg = `
        <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            ${segments}
        </svg>
    `;    
    
    return svg;
}
*/