import React from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'redux/store';
import { setPanel } from '../redux/guiSlice';

import './ReportButton.css';

const ReportButton: React.FC = () => {
    const dispatch = useDispatch();
    const { panel } = useSelector((state: RootState) => state.gui);

    const togglePanel = () => {
        if (panel === 'narrow') {
            dispatch(setPanel('full'));
        } else {
            dispatch(setPanel('narrow'));
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
