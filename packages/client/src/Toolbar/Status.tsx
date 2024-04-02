import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import { selectClusterCount, selectPointsCount } from '../redux/mapSlice';

import './Status.css';

const Panel: React.FC = () => {
    const pointsCount = useSelector(selectPointsCount);
    const clusterCount = useSelector(selectClusterCount);
    const [nothingToShow, setNothingToShow] = useState<boolean>(true);
    const showPoints = !clusterCount && pointsCount && pointsCount > 0;

    useEffect(() => {
        setNothingToShow(!clusterCount && !pointsCount);
    }, [pointsCount, clusterCount, nothingToShow]);

    return (
        <header className='report-ctrl component'>
            <span className='inner'>
                {nothingToShow ? (
                    <>{get('status.no_results')}</>
                ) : showPoints ? (
                    <>
                        {get('status.points_count', { count: pointsCount })}
                    </>
                ) : (
                    <>
                        {get('status.cluster_count', { count: clusterCount })}
                    </>
                )}
            </span>
        </header>
    );
};

export default Panel;
