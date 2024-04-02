/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';
import debounce from 'debounce';

import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateTime.css';

const TIME_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
const ANIMATION_SPEED = 1000 * 4;

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary } = useSelector((state: RootState) => state.map);
    const { from_date } = useSelector((state: RootState) => state.map);

    const initialDate = dictionary?.datetime?.min
        ? Number(dictionary.datetime.min)
        : from_date;

    const [localDate, setLocalDate] = useState<number>(initialDate);
    const [localMin, setLocalMin] = useState<number>(0);
    const [localMax, setLocalMax] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState<NodeJS.Timer | undefined>();
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    useEffect(() => {
        if (dictionary?.datetime?.min && dictionary.datetime.max && !gotTheFirstDictionary) {
            setLocalDate(Number(dictionary.datetime.min));
            setLocalMin(Number(dictionary.datetime.min));
            setLocalMax(Number(dictionary.datetime.max));
            setGotTheFirstDictionary(true);
        }
    }, [dictionary, gotTheFirstDictionary]);

    const debouncedHandleSubmit = debounce(handleSubmit, 500);

    function handleSubmit() {
        const fromDate = new Date(Number(localDate) - TIME_WINDOW_MS).getTime();
        const toDate = new Date(Number(localDate) + TIME_WINDOW_MS).getTime();

        console.log({ action: 'submit', localDate, localMin, localMax });

        dispatch(setFromDate(fromDate));
        dispatch(setToDate(toDate));
        dispatch(fetchFeatures());
    }

    function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value: number = parseInt(e.target.value);
        setLocalDate(value);
        debouncedHandleSubmit();
    }

    function animate() {
        if (!localMax || !localMin) {
            console.warn('animate called too early');
            return;
        }
        let newLocalDate = localDate + TIME_WINDOW_MS;
        if (newLocalDate > localMax) {
            newLocalDate = localMin;
        }
        setLocalDate(newLocalDate);
        handleSubmit();
    }

    function handleAnimate() {
        if (isAnimating) {
            console.info('Stop animation');
            clearInterval(isAnimating);
            setIsAnimating(undefined);
        } else {
            console.info('Start animation');
            const intervalId = setInterval(animate, ANIMATION_SPEED);
            setIsAnimating(intervalId);
        }
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
                onChange={handleSliderChange}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={handleAnimate} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
