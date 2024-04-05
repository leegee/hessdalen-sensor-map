import React, { useEffect, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';

import config from '@hessdalen-sensor-map/config/src';
import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { setIsAnimating } from '../redux/guiSlice';
import { RootState } from '../redux/store';

import './DateTime.css';
import { MapDictionaryType } from '@hessdalen-sensor-map/common-types';

const ANIMATION_SPEED = 3000;

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary, from_date } = useSelector((state: RootState) => state.map);
    const initialDate = dictionary?.datetime?.min ? Number(dictionary.datetime.min) : from_date;
    const { isAnimating } = useSelector((state: RootState) => state.gui);
    const [localTime, setLocalTime] = useState<number>(initialDate);
    const [localMin, setLocalMin] = useState<number>(0);
    const [localMax, setLocalMax] = useState<number>(0);
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    const createAnimationFrame = (intervalId: NodeJS.Timeout | undefined): NodeJS.Timeout | undefined => {
        clearTimeout(intervalId);
        const nextLocalTime = Number(localTime) + 10000;  // Number(config.gui.time_window_ms);

        if (nextLocalTime <= Number(localMax)) {
            console.debug(`GO! nextLocalTime < ${Number(localMax)}, updating localTime `);
            handleSliderChange(nextLocalTime);
        } else {
            console.debug(`Stop! nextLocalTime > Number(${localMax}) (dict max=${Number(dictionary?.datetime?.max ?? 0)} `);
            dispatch(setIsAnimating(false)); // Dispatch action to stop animation
        }

        return intervalId;
    };

    const requestFetchFeatures = useCallback(() => {
        dispatch(setFromDate(localTime - Number(config.gui.time_window_ms)));
        dispatch(setToDate(localTime + Number(config.gui.time_window_ms)));

        console.debug({ action: 'submit', localTime, debug_timestamp: new Date().getTime() });
        dispatch(fetchFeatures());
    }, [dispatch, localTime]);

    const handleSliderChange = (value: number) => {
        console.log('slider changed, local time = ', value);
        return value > 0 ? setLocalTime(Number(value)) : 0;
    }

    useEffect(
        () => requestFetchFeatures(),
        [localTime, requestFetchFeatures]
    );

    useEffect(() => {
        if (dictionary?.datetime?.min && dictionary.datetime.max && !gotTheFirstDictionary) {
            setGotTheFirstDictionary(true);
            setLocalMin(Number(dictionary.datetime.min));
            setLocalMax(Number(dictionary.datetime.max));
            setLocalTime(Number(dictionary.datetime.min));
        }
    }, [dictionary, gotTheFirstDictionary]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (!dictionary) {
            return;
        }
        if (isAnimating) {
            console.info('animation toggled to start');
            intervalId = createAnimationFrame(intervalId);
            intervalId = setTimeout(() => createAnimationFrame(intervalId), ANIMATION_SPEED);
        } else if (intervalId) {
            console.info(`animation - toggled to stop`);
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [localMax, isAnimating]);

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
                value={localTime}
                onInput={(e) => handleSliderChange(parseInt(e.currentTarget.value))}
                onMouseUp={requestFetchFeatures}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={toggleAnimation} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
