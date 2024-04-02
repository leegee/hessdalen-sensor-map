import React, { useEffect, useRef, useState } from 'react';
import { get } from 'react-intl-universal';
import type { Map } from 'ol';
import { MapBrowserEvent } from 'ol';
import { FeatureLike } from 'ol/Feature';
import Overlay from 'ol/Overlay';
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
            let tooltipContent = '';
            const location_text = feature.get('location_text') as string;
            if (location_text) {
                if (features.length === 1) {
                    const date = new Date(feature.get('datetime') as string);
                    tooltipContent = '<small>' + new Intl.DateTimeFormat(config.locale).format(date) + '</small><br/>';
                }
                tooltipContent += '<b font-style="font-size:120%">' + feature.get('location_text') + '</b>';
                if (features.length > 1) {
                    tooltipContent += ' x' + features.length;
                }
                const score = feature.get('search_score') as number;
                if (score) {
                    tooltipContent += '<br/><small style="font-weight:light">Search score: ' + score + '</small>';
                }
            }
            else {
                tooltipContent = get('panel.cluster_count', { count: Number(feature.get('num_points')) });
            }

            if (tooltipContent && tooltipElementRef.current !== null) {
                tooltipElementRef.current.innerHTML = tooltipContent;
                overlay.setPosition(event.coordinate);
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
