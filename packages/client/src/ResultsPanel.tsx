/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { selectClusterCount, selectPointsCount } from './redux/mapSlice';
import { setPanel } from './redux/guiSlice';
import FeatureTable from './FeaturesTable';

import './ResultsPanel.css';

const Panel: React.FC = () => {
    const dispatch = useDispatch();
    const pointsCount = useSelector(selectPointsCount);
    const clusterCount = useSelector(selectClusterCount);
    const [nothingToShow, setNothingToShow] = useState<boolean>(true);

    const onEscCloseFullReport = (e: KeyboardEvent) => { if (e.key === 'Escape') { dispatch(setPanel('hidden')) } };

    useEffect(() => {
        document.addEventListener('keyup', onEscCloseFullReport);
        return () => document.removeEventListener('keyup', onEscCloseFullReport)
    });

    useEffect(() => {
        if (pointsCount) {
            setPanel(nothingToShow ? 'narrow' : 'hidden')
        }
        setNothingToShow(!clusterCount && !pointsCount);

    }, [pointsCount, clusterCount, nothingToShow]);

    return (
        <section id='panel' className={(nothingToShow || clusterCount) ? 'nothing-to-show' : ''}>
            {nothingToShow ? (
                <p className='message'>
                    {get('panel.no_results')}
                </p>
            ) :
                pointsCount ?
                    <FeatureTable />
                    : <p className='message'>
                        {get('panel.only_clusters_not_points')}
                    </p>
            }
        </section>
    );
};

export default Panel;
