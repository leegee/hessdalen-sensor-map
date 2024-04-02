// layer-geo.ts

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

export default new TileLayer({
    source: new XYZ({
        url: 'https://c.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
        attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }),
});


// url: 'https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
// attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',


// url 'https://c.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'
// attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
