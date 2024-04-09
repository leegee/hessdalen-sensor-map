/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { selectPointsCount } from './redux/mapSlice';
import { RootState } from './redux/store';
import { setPanel } from './redux/guiSlice'
import FeatureTable from './FeaturesTable';
import ReportButton from './ReportButton';

import './ResultsPanel.css';

const Panel: React.FC = () => {
    const dispatch = useDispatch();
    const pointsCount = useSelector(selectPointsCount);
    const { isAnimating } = useSelector((state: RootState) => state.gui);

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
        setNothingToShow(!pointsCount);

    }, [pointsCount, nothingToShow]);

    return (
        <section id='panel' className={(nothingToShow) ? 'nothing-to-show' : ''}>
            {nothingToShow ? (
                <p className='message'>
                    {get('panel.no_results')}
                </p>
            ) :
                pointsCount ?
                    <>
                        <ReportButton />
                        <FeatureTable />
                    </>
                    : <p className='message'>
                        {get('panel.no_results')} (2)
                    </p>
            }
        </section>
    );
};

export default Panel;
