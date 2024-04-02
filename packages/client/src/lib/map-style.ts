// lib/sightings-styles.ts.ts

import { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style } from "ol/style";

import { store } from "../redux/store";

const bgSaturation = 100;
const bgLightness = 50;
const borderSaturation = 80;
const borderLightness = 20;

const rings = [
    new Style({
        image: new Circle({
            radius: 100,
            fill: new Fill({color: 'transparent'}),
            stroke: new Stroke({ width: 2, color: '#0F07' }),
        }),
    }),
    new Style({
        image: new Circle({
            radius: 50,
            fill: new Fill({color: 'transparent'}),
            stroke: new Stroke({ width: 2, color: '#0F08' }),
        }),
    }),
];

export const sightingsStyleFunction = (feature: FeatureLike): Style | Style[] => {
    // Points
    const selectionId = store.getState().gui.selectionId;
    const selected = selectionId && selectionId === feature.get('id');
    const score = parseFloat(feature.get('search_score') as string);
    const hue = 180;
    let alpha = 1;
    if (score) {
        alpha = score + 0.2;
        if (alpha < 0.55) {
            alpha = 0.55
        }
    }
    
    const colour = `hsla(${hue}, ${bgSaturation}%, ${bgLightness}%, ${alpha})`;

    return [
        ...( selected? rings : []),
        new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({
                    color: selected ? 'hsl(40,100%,70%)' : colour
                }),
                stroke: new Stroke(
                    selected ? {
                        color: 'hsl(40,100%,60%)',
                        width: 8
                    } : {
                        color: `hsla(${hue}, ${borderSaturation}%, ${borderLightness}%, ${alpha})`,
                        width: 3
                    }
                )
            }),
        })
    ];
};
