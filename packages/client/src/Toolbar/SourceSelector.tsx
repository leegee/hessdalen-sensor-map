import React, { type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { FeatureSourceAttributeType } from '@hessdalen-sensor-map/common-types';

import { RootState } from '../redux/store';
import { fetchFeatures, setSource } from '../redux/mapSlice';

const options = {
    'norge-ufo': 'Norge UFO',
    'mufon-kaggle': 'MUFON/Kaggle',
    'not-specified': 'All',
};

const SourceSelector: React.FC = () => {
    const dispatch = useDispatch();
    const { source } = useSelector((state: RootState) => state.map);

    function handleChange(e: FormEvent<HTMLElement>) {
        console.log((e.target as HTMLSelectElement).value);
        dispatch(setSource((e.target as HTMLSelectElement).value as FeatureSourceAttributeType));
        dispatch(fetchFeatures());
    }

    return <nav className='component' onChange={handleChange}>
        <select defaultValue={source}>
            {Object.keys(options).map(
                (option) => <option key={option} value={option}>{options[option as FeatureSourceAttributeType]}</option>
            )}
        </select>
    </nav>
}

export default SourceSelector;
