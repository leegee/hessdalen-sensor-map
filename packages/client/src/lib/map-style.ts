// lib/sightings-styles.ts.ts

import { FeatureLike } from "ol/Feature";
import { Circle, Fill, Stroke, Style } from "ol/style";

import { store } from "../redux/store";

export function mapScoreToHue(score: number): number {
    const value = Math.min(Math.max(score, 0), 1);
    const hue = (1 + value) * 180;
    return hue;
}

export const sightingsStyleFunction = (feature: FeatureLike): Style | Style[] => {
    const selectionId = store.getState().gui.selectionId;
    const selected = selectionId && selectionId === feature.get('id');
    const color = 'transparent';
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
