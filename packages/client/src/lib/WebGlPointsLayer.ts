import GeoJSON from 'ol/format/GeoJSON.js';
import Vector from 'ol/source/Vector.js';
import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import type { UfoFeatureCollection } from 'redux/mapSlice';

const predefinedStyles = {
    circles: {
        'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'rc_temperature'],
            0,
            4,
            1,
            8,
        ],
        'circle-fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'rc_temperature'],     // Numeric property to base the color on
            0,                                  // Minimum value of the numeric property
            'navy',                    // Dark color for minimum value
            1,                              // Maximum value of the numeric property
            'cyan'                    // Light color for maximum value
        ],
        'circle-rotate-with-view': false,
        'circle-displacement': [0, 0],
        'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'mag_z'],
            0,
            0.6,
            1,
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
    window.document.body.style.cursor = 'wait';
    vectorSource.clear();
    if (featureCollection.features !== null) {
        vectorSource.addFeatures(new GeoJSON().readFeatures(featureCollection));
    }
    vectorSource.changed();
    console.debug("Number of features added:", vectorSource.getFeatures().length);
    window.document.body.style.cursor = 'unset';
}

