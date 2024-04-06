// lib/sightings-styles.ts.ts

import { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style, Text } from "ol/style";

import { store } from "../redux/store";

const bgSaturation = 100;
const bgLightness = 50;
const borderSaturation = 80;
const borderLightness = 20;

export function mapScoreToHue(score: number): number {
    const value = Math.min(Math.max(score, 0), 1);
    const hue = (1 + value) * 180;
    return hue;
}

function mapLocalClusterToColor(): string {
    // console.log(feature)
    return 'blue';
}

const rings = [
    new Style({
        image: new Circle({
            radius: 100,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ width: 2, color: 'lime' }),
        }),
    }),
    new Style({
        image: new Circle({
            radius: 50,
            fill: new Fill({ color: 'transparent' }),
            stroke: new Stroke({ width: 2, color: 'lime' }),
        }),
    }),
];

export const sightingsStyleFunction = (feature: FeatureLike): Style | Style[] => {
    const features = feature.get('features') as any[] | undefined;
    const selectionId = store.getState().gui.selectionId;
    const selected = selectionId && selectionId === feature.get('id');
    const score = parseFloat(feature.get('search_score') as string);
    const color = 'cyan';
    const hue = '40';
    return [
        new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({
                    color: selected ? 'hsl(40,100%,70%)' : color
                }),
                stroke: new Stroke(
                    selected ? {
                        color: 'hsl(40,100%,60%)',
                        width: 8
                    } : {
                        color,
                        width: 3
                    }
                )
            }),
        })
    ];
};
