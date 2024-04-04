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

const createAnimationFrame = (
    intervalId: NodeJS.Timeout | undefined,
    localTime: number,
    handleSliderChange: (value: number) => void,
    setLocalTime: Dispatch<SetStateAction<any>>,
    requestFetchFeatures: Dispatch<any>,
    dictionary: MapDictionaryType,
    dispatch: any,
) => {
    clearTimeout(intervalId);
    const nextLocalTime = localTime + Number(config.gui.time_window_ms);
    if (nextLocalTime <= Number(dictionary.datetime?.max ?? 0)) {
        console.debug(`GO! nextLocalTime < ${Number(dictionary.datetime?.max ?? 0)}`);
        handleSliderChange(nextLocalTime);
        requestFetchFeatures();
        setLocalTime(nextLocalTime);
    } else {
        console.debug(`Stop! nextLocalTime > ${Number(dictionary.datetime?.max ?? 0)}`);
        dispatch(setIsAnimating(false)); // Dispatch action to stop animation
    }

    intervalId = setTimeout(() => {
        createAnimationFrame(intervalId, localTime, handleSliderChange, requestFetchFeatures, setLocalTime, dictionary, dispatch);
    }, ANIMATION_SPEED);

    return intervalId;
};

const DateTime: React.FC = () => {
    const dispatch = useDispatch();
    const { dictionary, from_date } = useSelector((state: RootState) => state.map);
    const initialDate = dictionary?.datetime?.min ? Number(dictionary.datetime.min) : from_date;
    const { isAnimating } = useSelector((state: RootState) => state.gui);
    const [localTime, setLocalTime] = useState<number>(initialDate);
    const [localMin, setLocalMin] = useState<number>(0);
    const [localMax, setLocalMax] = useState<number>(0);
    const [gotTheFirstDictionary, setGotTheFirstDictionary] = useState(false);

    const requestFetchFeatures = useCallback(() => {
        dispatch(setFromDate(localTime - Number(config.gui.time_window_ms)));
        dispatch(setToDate(localTime + Number(config.gui.time_window_ms)));

        console.debug({ action: 'submit', localDate: localTime, debug_timestamp: new Date().getTime() });
        dispatch(fetchFeatures());
    }, [dispatch, localTime]);

    const handleSliderChange = (value: number) => {
        return value > 0 ? setLocalTime(Number(value)) : 0;
    }

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
            intervalId = createAnimationFrame(intervalId, localTime, handleSliderChange, requestFetchFeatures, setLocalTime, dictionary, dispatch);
        } else if (intervalId) {
            console.info(`animation - toggled to stop`);
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [dictionary?.datetime?.max, isAnimating, localMax, requestFetchFeatures, dispatch, localTime, dictionary]);

    const toggleAnimation = () => dispatch(setIsAnimating(!isAnimating));

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
                value={localTime}
                onInput={(e) => handleSliderChange(parseInt(e.currentTarget.value))}
                onMouseUp={requestFetchFeatures}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={toggleAnimation} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
