/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';
import debounce from 'debounce';

import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateTime.css';
import config from '@hessdalen-sensor-map/config/src';

const ANIMATION_FRAME_MS = 1000;
const SLIDER_DEBOUNCE_MS = 1000;

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
            setLocalDate(Number(dictionary.datetime.min));
            setLocalMin(Number(dictionary.datetime.min));
            setLocalMax(Number(dictionary.datetime.max));
            setGotTheFirstDictionary(true);
        }
    }, [dictionary, gotTheFirstDictionary]);

    const handleSliderChange = debounce((value: number) => {
        setLocalDate(value);
        const fromDate = value - Number(config.gui.time_window_ms);
        const toDate = value + Number(config.gui.time_window_ms);
        dispatch(setFromDate(fromDate));
        dispatch(setToDate(toDate));
        console.log({ action: 'slider change', localDate: value, fromDate, toDate });
    }, SLIDER_DEBOUNCE_MS);

    const handleSubmit = debounce(() => {
        const fromDate = localDate - Number(config.gui.time_window_ms);
        const toDate = localDate + Number(config.gui.time_window_ms);
        dispatch(setFromDate(fromDate));
        dispatch(setToDate(toDate));
        console.log({ action: 'submit', localDate, fromDate, toDate });
        dispatch(fetchFeatures());
    }, ANIMATION_FRAME_MS - 10);

    function toggleAnimation() {
        setIsAnimating(prev => !prev);
    }

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;

        if (isAnimating) {
            intervalId = setInterval(() => {
                setLocalDate(prevLocalDate => {
                    const newLocalDate = prevLocalDate + config.gui.time_window_ms;
                    if (newLocalDate <= localMax) {
                        handleSubmit();
                        return newLocalDate;
                    } else {
                        setIsAnimating(false);
                        return prevLocalDate;
                    }
                });
            }, ANIMATION_FRAME_MS);
        }
        else if (intervalId) {
            clearInterval(intervalId);
        }

        return () => {
            clearInterval(intervalId);
        };
    }, [isAnimating, localMax, handleSubmit]);

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
                onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLocalDate(value);
                    handleSliderChange(value);
                }}
            />
            <span className={'submit ' + (isAnimating ? 'stop' : 'start')} onClick={toggleAnimation} title={get('datetime.animate')} aria-label={get('datetime.animate')}></span>
        </nav>
    );
}

export default DateTime;
