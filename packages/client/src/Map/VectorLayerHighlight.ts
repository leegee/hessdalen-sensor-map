// map/VectorlayerHighlight

import type { Map } from 'ol';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle, Style, Stroke, Fill } from 'ol/style';

export const FEATURE_IS_HIGHLIGHT_PROP = 'isHighilght';

const featureSource = new VectorSource();

const featureOverlay = new VectorLayer({
    source: featureSource,
    style: () => {
        return [
            new Style({
                image: new Circle({
                    radius: 10,
                    fill: new Fill({ color: 'transparent' }),
                    stroke: new Stroke({
                        color: 'orange',
                        width: 3
                    })
                }),
            }),
            new Style({
                image: new Circle({
                    radius: 13,
                    fill: new Fill({ color: 'transparent' }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 1
                    })
                }),
            })
        ];
    },
});

let highlight: Feature;

export function setupFeatureHighlighting(map: Map) {
    featureOverlay.setVisible(true);
    featureOverlay.setZIndex(100);
    map.addLayer(featureOverlay);

    map.on('pointermove', function (evt) {
        if (evt.dragging) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const pixel = map.getEventPixel(evt.originalEvent);
        highlightFeature(map, pixel);
    });
}

function highlightFeature(map: Map, pixel: number[]) {
    const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
        return feature;
    });

    if (feature !== highlight) {
        if (typeof highlight !== 'undefined') {
            featureSource.removeFeature(highlight);
        }
        if (feature) {
            (feature as Feature).set(FEATURE_IS_HIGHLIGHT_PROP, true);
            featureSource.addFeature(feature as Feature);
        }
        highlight = feature as Feature;
    }
}
