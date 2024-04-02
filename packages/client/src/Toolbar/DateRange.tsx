import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { MapDictionaryType } from '@hessdalen-sensor-map/common-types';
import { fetchFeatures, setFromDate, setToDate, selectPointsCount } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateRange.css';
import { get } from 'react-intl-universal';

const DateRange: React.FC = () => {
    const dispatch = useDispatch();
    const dictionary: MapDictionaryType | undefined = useSelector((state: RootState) => state.map.dictionary);
    const pointsCount = useSelector(selectPointsCount);
    const { from_date, to_date } = useSelector((state: RootState) => state.map);
    const [localFromDate, setLocalFromDate] = useState(from_date);
    const [localToDate, setLocalToDate] = useState(to_date);

    useEffect(() => {
        if (dictionary?.datetime) {
            setLocalFromDate(dictionary.datetime.min ?? undefined);
            setLocalToDate(dictionary.datetime.max ?? undefined);
        }
    }, [dispatch, dictionary]);

    function handleSubmit() {
        // TODO restore the checks from history
        if (isNaN(Number(localFromDate))) {
            setLocalFromDate(undefined);
        }
        if (isNaN(Number(localToDate))) {
            setLocalToDate(undefined);
        }

        if (!localFromDate || !localToDate || localFromDate < localToDate) {
            dispatch(setFromDate(localFromDate));
            dispatch(setToDate(localToDate));
            dispatch(fetchFeatures());
        }
    }

    function handleFromDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value: string | number = parseInt(e.target.value);
        // if (isNaN(value)) {
        //     value = '';
        // }
        setLocalFromDate(value);
    }

    function handleToDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value: number | undefined = Number(parseInt(e.target.value));
        if (isNaN(value)) {
            value = undefined;
        }
        setLocalToDate(value);
    }

    return (
        <nav className='date-range component highlightable'>
            {pointsCount ? (
                <Link to="/histogram/dates">
                    <span className='grey calendar-icon' title={get('date_range.histogram-button')} aria-label={get('date_range.histogram-button')} />
                </Link>
            ) : (
                <span className='grey calendar-icon' title={get('date_range.title')} aria-label={get('date_range.title')} />
            )}
            <input
                title={get('date_range.min')}
                aria-label={get('date_range.min')}
                type='number'
                id='minYear'
                name='minYear'
                value={localFromDate ?? ''}
                onChange={handleFromDateChange}
            />
            -
            <input
                title={get('date_range.max')}
                aria-label={get('date_range.max')}
                type='number'
                id='maxYear'
                name='maxYear'
                value={localToDate ?? ''}
                onChange={handleToDateChange}
            />

            <span className='submit' onClick={handleSubmit} title={get('date_range.submit')} aria-label={get('date_range.submit')}>▶</span>
        </nav>
    );
}

export default DateRange;
