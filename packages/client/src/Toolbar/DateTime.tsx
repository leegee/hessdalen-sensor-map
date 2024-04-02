/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateTime.css';
import { get } from 'react-intl-universal';

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary } = useSelector((state: RootState) => state.map);
    const { from_date, to_date } = useSelector((state: RootState) => state.map);

    const initialDate = dictionary?.datetime?.min && dictionary?.datetime?.max
        ? (dictionary.datetime.min + dictionary.datetime.max) / 2
        : ((from_date + to_date) || 0) / 2;

    const [localDate, setLocalDate] = useState(initialDate);

    useEffect(() => {
        if (dictionary?.datetime?.min && dictionary.datetime.max) {
            setLocalDate((dictionary.datetime.min + dictionary.datetime.max) / 2);
        }
    }, [dictionary]);

    function handleSubmit() {
        dispatch(setFromDate(localDate));
        dispatch(setToDate(localDate));
        dispatch(fetchFeatures());
    }

    function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value: number = parseInt(e.target.value);
        setLocalDate(value);
    }

    return (
        <nav id='datetime-selector' className='component highlightable'>
            <input
                title={get('datetime.title')}
                aria-label={get('datetime.title')}
                type='range'
                id='datetime'
                name='datetime'
                min={dictionary?.datetime?.min}
                max={dictionary?.datetime?.max}
                value={localDate}
                onChange={handleDateChange}
            />
            <span className='submit' onClick={handleSubmit} title={get('datetime.submit')} aria-label={get('datetime.submit')}>▶</span>
        </nav>
    );
}

export default DateTime;
