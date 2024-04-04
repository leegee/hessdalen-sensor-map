import React, { useEffect, useRef, useState } from 'react';
import { get } from 'react-intl-universal';
import type { Map } from 'ol';
import { MapBrowserEvent } from 'ol';
import { FeatureLike } from 'ol/Feature';
import Overlay, { Positioning } from 'ol/Overlay';
import config from '@hessdalen-sensor-map/config/src';
import { FEATURE_IS_HIGHLIGHT_PROP } from './VectorLayerHighlight';

import './Tooltip.css';

interface TooltipComponentProps {
    map: Map;
}

const Tooltip: React.FC<TooltipComponentProps> = ({ map }) => {
    const [overlay, setOverlay] = useState<Overlay>();
    const tooltipElementRef = useRef<HTMLDivElement>(null);

    const handleMapHover = (event: MapBrowserEvent<MouseEvent>) => {
        if (!overlay) {
            return;
        }

        let feature: FeatureLike | undefined = undefined;
        const features: FeatureLike[] = [];
        event.map.forEachFeatureAtPixel(event.pixel, (checkFeature) => {
            features.push(checkFeature);
        });

        // Skip any highlight
        feature = features.find(
            feature => !feature.get(FEATURE_IS_HIGHLIGHT_PROP)
        );

        // If there was a highlight, pop the list to allow correct count of features
        if (features.length > 1 && !feature) {
            features.pop();
        }

        if (!feature) {
            feature = features[0];
        }

        if (typeof feature === 'undefined') {
            overlay.setPosition(undefined);
        }
        else {
            const props = feature.getProperties();
            let tooltipContent = `
            <h4>
            ${props.logger_id}
            <small>
                ${new Intl.DateTimeFormat(config.locale).format(new Date(feature.get('timestamp') as string))}
            </small>
            </h4>
            <table><tbody>`;

            for (const prop of Object.keys(props).filter(
                _ => !_.includes('geometry')
            )) {
                tooltipContent += `<tr><th>${prop}</th><td>${props[prop]}</td></tr>`;
            }

            tooltipContent += '</tbody></table>';

            if (tooltipContent && tooltipElementRef.current !== null) {
                const mapSize = map.getSize();
                if (mapSize) {
                    const viewportWidth = mapSize[0];
                    const viewportHeight = mapSize[1];
                    tooltipElementRef.current.innerHTML = tooltipContent;
                    const cursorX = event.pixel[0];
                    const cursorY = event.pixel[1];
                    const positioningY = cursorY < viewportHeight / 3 ? 'top' : 'bottom';
                    const positioningX = cursorX < viewportWidth / 2 ? 'left' : 'right';
                    const positioning = positioningY + '-' + positioningX as Positioning;
                    overlay.setPosition(event.coordinate);
                    overlay.setPositioning(positioning);
                } else {
                    overlay.setPosition(event.coordinate);
                }
            } else {
                overlay.setPosition(undefined);
            }
        }
    };

    useEffect(() => {
        const newOverlay = new Overlay({
            element: tooltipElementRef.current as HTMLElement,
            offset: [10, 0],
            positioning: 'bottom-left',
            stopEvent: false,
        });

        setOverlay(newOverlay);
        map.addOverlay(newOverlay);

        map.on('pointermove', handleMapHover);

        return () => {
            map.removeOverlay(newOverlay);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {
        map.on('pointermove', handleMapHover);
        return () => {
            if (overlay) {
                map.removeOverlay(overlay);
            }
            map.un('pointermove', handleMapHover);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, overlay]);

    return <aside ref={tooltipElementRef} className="tooltip" />;
};

export default Tooltip;
