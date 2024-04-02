import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'redux/store';
import { setPanel } from '../redux/guiSlice';

import './ReportButton.css';

const ReportButton: React.FC = () => {
    const dispatch = useDispatch();
    const { panel } = useSelector((state: RootState) => state.gui);

    useEffect(() => {
        console.log("Panel state:", panel);
    }, [panel]);

    const togglePanel = () => {
        if (panel === 'full') {
            dispatch(setPanel('narrow'));
        } else {
            dispatch(setPanel('full'));
        }
    };

    return (
        <button className='component highlightable report-button' onClick={togglePanel}>
            {panel === 'narrow' ? (
                <>
                    <span className='open-full-width' title={get('open')} aria-label={get('open')} />
                </>
            ) : (
                <>
                    <span className='close-full-width' title={get('close')} aria-label={get('close')} />
                </>
            )}
        </button>
    );
};

export default ReportButton;
