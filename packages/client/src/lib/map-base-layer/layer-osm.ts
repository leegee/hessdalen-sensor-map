// lib/layer-osm.ts

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const osmLayer = new TileLayer({ source: new OSM() });

export default osmLayer;

