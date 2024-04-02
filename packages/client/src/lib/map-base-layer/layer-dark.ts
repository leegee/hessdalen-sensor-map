// layer-dark.ts - cartoDarkLayer

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

const cartonDark = new TileLayer({
    source: new XYZ({
        url: 'https://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: 'CartoDB'
    }),
});

export default cartonDark;


