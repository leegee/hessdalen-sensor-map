import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';

import config from '@hessdalen-sensor-map/config/src';
import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { setIsAnimating } from '../redux/guiSlice';
import { RootState } from '../redux/store';

import './DateTime.css';
import debounce from 'debounce';

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary, from_date } = useSelector((state: RootState) => state.map);
    const initialDate = dictionary?.datetime?.min ? Number(dictionary.datetime.min) : from_date;
    const { isAnimating } = useSelector((state: RootState) => state.gui);
    const [localTime, setLocalTime] = useState<number>(initialDate);
    const [localMin, setLocalMin] = useState<number>(0);
    const [localMax, setLocalMax] = useState<number>(0);
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    const createAnimationFrame = useCallback((intervalId: NodeJS.Timeout | undefined): NodeJS.Timeout | undefined => {
        const nextLocalTime = Number(localTime) + Number(config.gui.time_window_ms);
        if (nextLocalTime <= Number(localMax)) {
            handleSliderChange(nextLocalTime);
        } else {
            clearTimeout(intervalId);
            dispatch(setIsAnimating(false));
        }

        return intervalId;
    }, [localTime, localMax, dispatch]);

    const _requestFetchFeatures = () => {
        dispatch(setFromDate(localTime - Number(config.gui.time_window_ms)));
        dispatch(setToDate(localTime + Number(config.gui.time_window_ms)));
        dispatch(fetchFeatures());
        console.debug({ action: 'submit', localTime, debug_timestamp: new Date().getTime() });
    };

    const requestFetchFeatures = useCallback(
        debounce(_requestFetchFeatures, config.gui.animation_speed),
        [dispatch, localTime]
    );

    const handleSliderChange = (value: number) => value > 0 ? setLocalTime(Number(value)) : 0;

    useEffect(
        () => {
            console.debug(`localTime changed ${localTime}, fetching features`);
            return requestFetchFeatures();
        },
        [localTime, requestFetchFeatures]
    );

    useEffect(() => {
        if (!gotTheFirstDictionary && (
            dictionary?.datetime?.min && dictionary.datetime.max
        )) {
            setGotTheFirstDictionary(true);
            setLocalMin(Number(dictionary.datetime.min));
            setLocalMax(Number(dictionary.datetime.max));
            setLocalTime(Number(dictionary.datetime.min));
            console.debug({
                action: 'Got the first dictionary',
                datetime: dictionary.datetime,
                localMin: new Date(dictionary.datetime.min).toLocaleString(),
                localMax: new Date(dictionary.datetime.max).toLocaleString(),
                localTime: new Date(dictionary.datetime.min).toLocaleString(),
            });
        }
    }, [dictionary, gotTheFirstDictionary]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (!gotTheFirstDictionary) {
            return;
        }
        if (isAnimating) {
            intervalId = setTimeout(() => createAnimationFrame(intervalId), Number(config.gui.animation_speed));
        } else if (intervalId) {
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [gotTheFirstDictionary, isAnimating, localMax, createAnimationFrame]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown)
    });

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === ' ') {
            toggleAnimation();
        }
        else if (e.key === 'ArrowRight') {
            setLocalTime(localTime + Number(config.gui.time_window_ms));
        }
        else if (e.key === 'ArrowLeft') {
            setLocalTime(localTime - Number(config.gui.time_window_ms));
        }
    }

    const toggleAnimation = () => dispatch(setIsAnimating(!isAnimating));

    return (
        <nav id='datetime-selector' className='component highlightable'>
            <input
                title={get('datetime.title') + ' ' + new Date(localTime).toLocaleString()}
                aria-label={get('datetime.title')}
                type='range'
                id='datetime'
                name='datetime'
                min={localMin}
                max={localMax}
                step={(localMax - localMin) / config.gui.time_window_ms}
                value={localTime}
                onInput={(e) => handleSliderChange(parseInt(e.currentTarget.value))}
                onMouseUp={requestFetchFeatures}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={toggleAnimation} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
