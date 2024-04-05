import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';

import config from '@hessdalen-sensor-map/config/src';
import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { setIsAnimating } from '../redux/guiSlice';
import { RootState } from '../redux/store';

import './DateTime.css';

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

    const createAnimationFrame = useCallback((intervalId: NodeJS.Timeout | undefined): NodeJS.Timeout | undefined => {
        const nextLocalTime = Number(localTime) + (10 * 60 * 1000);  // Number(config.gui.time_window_ms || 10000);
        console.debug(`createAnimationFrame at localTime ${localTime}, localMax ${localMax}, dict.max ${dictionary?.datetime?.max}`);
        if (nextLocalTime <= Number(localMax)) {
            console.debug(`GO! nextLocalTime < ${Number(localMax)}, updating localTime `);
            handleSliderChange(nextLocalTime);
        } else {
            console.debug(`Stop! nextLocalTime > Number(${localMax}) (dict max=${Number(dictionary?.datetime?.max ?? 0)} `);
            clearTimeout(intervalId);
            dispatch(setIsAnimating(false));
        }

        return intervalId;
    }, [localTime, localMax, dictionary?.datetime?.max, dispatch]);

    const requestFetchFeatures = useCallback(() => {
        dispatch(setFromDate(localTime - Number(config.gui.time_window_ms)));
        dispatch(setToDate(localTime + Number(config.gui.time_window_ms)));
        dispatch(fetchFeatures());
        console.debug({ action: 'submit', localTime, debug_timestamp: new Date().getTime() });
    }, [dispatch, localTime]);

    const handleSliderChange = (value: number) => {
        console.log('slider changed, local time = ', value);
        return value > 0 ? setLocalTime(Number(value)) : 0;
    }

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
            console.info('animation toggled to start');
            // intervalId = createAnimationFrame(intervalId);
            intervalId = setTimeout(() => createAnimationFrame(intervalId), ANIMATION_SPEED);
        } else if (intervalId) {
            console.info(`animation - toggled to stop`);
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [gotTheFirstDictionary, isAnimating, localMax, createAnimationFrame]);

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
