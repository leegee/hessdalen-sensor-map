import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import type { RootState } from '../redux/store';
import { selectPointsCount } from '../redux/mapSlice';

import './Status.css';

const DATE_LOCALE_OPTIONS: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
};

const Panel: React.FC = () => {
    const pointsCount = useSelector(selectPointsCount);
    const { from_date, to_date } = useSelector((state: RootState) => state.map);
    const [nothingToShow, setNothingToShow] = useState<boolean>(true);
    const showPoints = pointsCount > 0;

    useEffect(() => {
        setNothingToShow(!pointsCount);
    }, [pointsCount, nothingToShow]);

    return (
        <header id='status' className='component'>
            < span className='inner' >
                {
                    nothingToShow ? (
                        <> {get('status.no_results')}</>
                    ) : showPoints ? (
                        <> {get('status.points_count', { count: pointsCount })} </>
                    ) : (
                        <> Unexpected state </>
                    )}

                {
                    from_date > 0 && (
                        <>
                            {get('from')}
                            <time dateTime={new Date(from_date).toISOString()} >
                                {new Date(from_date).toLocaleString([], DATE_LOCALE_OPTIONS)
                                }
                            </time>
                        </>
                    )
                }

                {
                    to_date > 0 && get('to') && (
                        <>
                            {get('to')}
                            <time dateTime={new Date(to_date).toISOString()}>
                                {new Date(to_date).toLocaleString()}
                            </time>
                        </>
                    )
                }
            </span >
        </header >
    );
};

export default Panel;
