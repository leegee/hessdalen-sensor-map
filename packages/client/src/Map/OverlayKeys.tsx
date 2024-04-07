import React from 'react';
import { DEFAULT_DIMENSIONS } from '../redux/mapSlice';
import './OverlayKeys.css';

const OverlayKeys: React.FC = () => {
    return (
        <dl id='overlay-key'>
            {Object.keys(DEFAULT_DIMENSIONS).map((dimension, index) => (
                <span key={index}>
                    <dt className={dimension}></dt>
                    <dd>{dimension}</dd>
                </span>
            ))
            }
        </dl >
    );
};

export default OverlayKeys;
