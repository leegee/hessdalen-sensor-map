import GeoJSON from 'ol/format/GeoJSON.js';
import Vector from 'ol/source/Vector.js';
import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import type { UfoFeatureCollection } from 'redux/mapSlice';

const predefinedStyles = {
    icons: {
        'icon-src': 'data/icon.png',
        'icon-width': 18,
        'icon-height': 28,
        'icon-color': 'lightyellow',
        'icon-rotate-with-view': false,
        'icon-displacement': [0, 9],
    },
    triangles: {
        'shape-points': 3,
        'shape-radius': 9,
        'shape-fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            20000,
            '#5aca5b',
            300000,
            '#ff6a19',
        ],
        'shape-rotate-with-view': true,
    },
    'triangles-latitude': {
        'shape-points': 3,
        'shape-radius': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            40000,
            6,
            2000000,
            12,
        ],
        'shape-fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'latitude'],
            -60,
            '#ff14c3',
            -20,
            '#ff621d',
            20,
            '#ffed02',
            60,
            '#00ff67',
        ],
        'shape-opacity': 0.95,
    },
    circles: {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            40000,
            4,
            2000000,
            14,
        ],
        'circle-fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'rc_temperature'],     // Numeric property to base the color on
            0,                                  // Minimum value of the numeric property
            '#333',                    // Dark color for minimum value
            1,                              // Maximum value of the numeric property
            'lime'                    // Light color for maximum value
        ],
        'circle-rotate-with-view': false,
        'circle-displacement': [0, 0],
        'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            40000,
            0.6,
            2000000,
            0.92,
        ],
    },
    'circles-zoom': {
        // by using an exponential interpolation with a base of 2 we can make it so that circles will have a fixed size
        // in world coordinates between zoom level 5 and 15
        'circle-radius': [
            'interpolate',
            ['exponential', 2],
            ['zoom'],
            5,
            1.5,
            15,
            1.5 * Math.pow(2, 10),
        ],
        'circle-fill-color': ['match', ['get', 'hover'], 1, '#ff3f3f', '#006688'],
        'circle-displacement': [0, 0],
        'circle-opacity': 0.95,
    },
    'rotating-bars': {
        'shape-rotation': ['*', ['time'], 0.13],
        'shape-points': 4,
        'shape-radius': 4,
        'shape-radius2': 4 * Math.sqrt(2),
        'shape-scale': [
            'array',
            1,
            ['interpolate', ['linear'], ['get', 'population'], 20000, 1, 300000, 7],
        ],
        'shape-fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'population'],
            20000,
            '#ffdc00',
            300000,
            '#ff5b19',
        ],
        'shape-displacement': [
            'array',
            0,
            ['interpolate', ['linear'], ['get', 'population'], 20000, 2, 300000, 14],
        ],
    },
};

const vectorSource = new Vector({
    // url: 'data/geojson/world-cities.geojson',
    format: new GeoJSON(),
    wrapX: true,
});

export const vectorLayer = new WebGLPointsLayer({
    source: vectorSource,
    style: predefinedStyles.circles,
});

vectorLayer.set('name', 'points');
vectorLayer.setVisible(true);

export function updateVectorLayer(featureCollection: UfoFeatureCollection) {
    vectorSource.clear();
    if (featureCollection.features !== null) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    }
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
}

