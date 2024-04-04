/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';

import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateTime.css';
import config from '@hessdalen-sensor-map/config/src';

const ANIMATION_SPEED = 1000;

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
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    useEffect(() => {
        if (dictionary?.datetime?.min && dictionary.datetime.max && !gotTheFirstDictionary) {
            setGotTheFirstDictionary(true);
            setLocalMin(Number(dictionary.datetime.min));
            setLocalMax(Number(dictionary.datetime.max));
            setLocalDate(Number(dictionary.datetime.min));
        }
    }, [dictionary, gotTheFirstDictionary]);

    // eslint-disable-next-line prefer-const
    let debounceTimer = 0;

    const requestFetchFeatures = useCallback(() => {
        const preDebouncer = debounceTimer;
        debounceTimer + new Date().getTime();
        if (preDebouncer > 0 && (preDebouncer - debounceTimer < 1000)) {
            return;
        }

        console.debug({ action: 'submit', localDate, debug_timestamp: new Date().getTime() });
        dispatch(setFromDate(
            localDate - Number(config.gui.time_window_ms)
        ));
        dispatch(setToDate(
            localDate + Number(config.gui.time_window_ms)
        ));
        dispatch(fetchFeatures());
    }, [dispatch, localDate, debounceTimer]);

    const debouncedFetchFeatures = requestFetchFeatures;

    const handleSliderChange = (value: number) => setLocalDate(Number(value));

    const toggleAnimation = () => setIsAnimating(prev => !prev);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        if (isAnimating) {
            intervalId = setInterval(() => {
                setLocalDate(prevLocalDate => {
                    const newLocalDate = prevLocalDate + config.gui.time_window_ms;
                    if (newLocalDate <= localMax) {
                        requestFetchFeatures();
                        return newLocalDate;
                    } else {
                        setIsAnimating(false);
                        return prevLocalDate;
                    }
                });
            }, ANIMATION_SPEED);
        }
        else if (intervalId) {
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [isAnimating, localMax, requestFetchFeatures]);

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
                onInput={(e) => handleSliderChange(parseInt(e.currentTarget.value))}
                onMouseUp={debouncedFetchFeatures}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={toggleAnimation} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
