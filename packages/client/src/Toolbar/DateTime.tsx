/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';
import debounce from 'debounce';

import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateTime.css';

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary } = useSelector((state: RootState) => state.map);
    const { from_date, to_date } = useSelector((state: RootState) => state.map);

    const initialDate = dictionary?.datetime?.min && dictionary?.datetime?.max
        ? (dictionary.datetime.min + dictionary.datetime.max) / 2
        : ((from_date + to_date) || 0) / 2;

    const [localDate, setLocalDate] = useState(initialDate);
    const [localMin, setLocalMin] = useState(dictionary?.datetime?.min);
    const [localMax, setLocalMax] = useState(dictionary?.datetime?.max);
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    useEffect(() => {
        if (dictionary?.datetime?.min && dictionary.datetime.max && !gotTheFirstDictionary) {
            setLocalDate((dictionary.datetime.min + dictionary.datetime.max) / 2);
            setLocalMin(dictionary.datetime.min);
            setLocalMax(dictionary.datetime.max);
            setGotTheFirstDictionary(true);
        }
    }, [dictionary, gotTheFirstDictionary]);

    const debouncedHandleSubmit = debounce(handleSubmit, 500);

    function handleSubmit() {
        const halfDayMilliseconds = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

        const fromDate = new Date(localDate - halfDayMilliseconds).getTime();
        const toDate = new Date(localDate + halfDayMilliseconds).getTime();

        console.log(`handle timestamp submit of ${localDate} bewtween`, localMin, localMax);

        dispatch(setFromDate(fromDate));
        dispatch(setToDate(toDate));
        dispatch(fetchFeatures());
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value: number = parseInt(e.target.value);
        setLocalDate(value);
        debouncedHandleSubmit();
    }

    return (
        <nav id='datetime-selector' className='component highlightable'>
            <input
                title={get('datetime.title')}
                aria-label={get('datetime.title')}
                type='range'
                id='datetime'
                name='datetime'
                min={localMin}
                max={localMax}
                value={localDate}
                onChange={handleDateChange}
            />
            <span className='submit' onClick={handleSubmit} title={get('datetime.submit')} aria-label={get('datetime.submit')}>▶</span>
        </nav>
    );
}

export default DateTime;
