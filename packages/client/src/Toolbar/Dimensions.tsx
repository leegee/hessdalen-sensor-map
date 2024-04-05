import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import './Dimensions.css';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setSelectedDimensions } from '../redux/mapSlice';

const dimensions = ['mag_x', 'mag_y', 'mag_z', 'rc_temperature'];

const Dimensions: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLSelectElement>(null);
    const { selectedDimensions } = useSelector((state: RootState) => state.map);
    const dispatch = useDispatch();

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions: Record<string, boolean> = {};
        Array.from(event.target.selectedOptions).forEach((option) => {
            selectedOptions[option.value] = option.selected;
        });
        dispatch(setSelectedDimensions(selectedOptions));  // Dispatch the action to update Redux state
    };

    const handleLinkClick = () => {
        setIsOpen(!isOpen);
        if (selectRef.current) {
            selectRef.current.focus();
        }
    };

    return (
        <nav id='dimension-selector' className='component'>
            <a href="#" onClick={handleLinkClick}>
                {Object.values(selectedDimensions).filter(Boolean).length}&nbsp;dim
            </a>
            {isOpen && (
                <select
                    multiple
                    onChange={handleSelectChange}
                    ref={selectRef}
                    onBlur={() => setIsOpen(false)}
                    style={{ display: 'block' }}
                >
                    {dimensions.map((dimension) => (
                        <option key={dimension} value={dimension}>
                            {dimension}
                        </option>
                    ))}
                </select>
            )}
        </nav>
    );
};

export default Dimensions;
