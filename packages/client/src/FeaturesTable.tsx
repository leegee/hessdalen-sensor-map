/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* Create the interface for feature.properties */
import React, { useEffect, useRef, useState } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import config from '@hessdalen-sensor-map/config/src';
import { RootState } from './redux/store';
import { setPanel, setSelectionId } from './redux/guiSlice';

import './FeatureTable.css';

function getRowId(id: number | string) {
    return 'fid_' + id;
}

function getIdFromRow_id(id: number | string) {
    return Number(String(id).substring(4));
}

const FeatureTable: React.FC = () => {
    const dispatch = useDispatch();
    const featureCollection = useSelector((state: RootState) => state.map.featureCollection);
    const { selectionId } = useSelector((state: RootState) => state.gui);
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);
    const selectedRowRef = useRef<HTMLTableRowElement>(null);

    function handleClickRow(id: number) {
        dispatch(setSelectionId(Number(id)));
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!selectionId || !featureCollection?.features) {
            return;
        }
        const selectedRow = document.querySelector('#' + getRowId(selectionId));

        if (event.key === 'ArrowUp') {
            const previousRow = selectedRow ? selectedRow.previousElementSibling : null;
            if (previousRow?.id) {
                dispatch(setSelectionId(getIdFromRow_id(previousRow.id)));
            }
        } else if (event.key === 'ArrowDown') {
            const nextRow = selectedRow ? selectedRow.nextElementSibling : null;
            if (nextRow?.id) {
                dispatch(setSelectionId(getIdFromRow_id(nextRow.id)));
            }
        } else if (event.key === 'PageUp') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const firstRowId = featureCollection.features.length > 0 ? featureCollection.features[0].id : null;
            dispatch(setSelectionId(getIdFromRow_id(firstRowId)));
        } else if (event.key === 'PageDown') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const lastRowId = featureCollection.features.length > 0 ? featureCollection.features[featureCollection.features.length - 1].id : null;
            if (lastRowId) {
                dispatch(setSelectionId(getIdFromRow_id(lastRowId)));
            }

        } else if (event.key === 'Home') {
            // Handle Home key
        } else if (event.key === 'End') {
            // Handle End key
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    // Scroll the selected row into view when user selectionchanges, if it is not already visible
    useEffect(() => {
        if (selectedRowRef.current) {
            const rect = selectedRowRef.current.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        }
    }, [selectionId]);

    useEffect(() => {
        if (featureCollection) {
            if (featureCollection.features !== null) {
                setLocalFeatures(featureCollection.features);
            }
        }
    }, [featureCollection]);

    function getRowClass(id: number) {
        return selectionId && selectionId === Number(id) ? 'tr selected' : 'tr';
    }

    function showPointOnMap(feature: any) {
        dispatch(setPanel('narrow'));
        dispatch(setSelectionId(Number(feature.properties.id)));
    }

    return (
        <table id='feature-table'>
            <thead className='thead'>
                <tr className='tr'>
                    <th className='th datetime'>{get('feature_table.date')}</th>
                    <th className='th number'>{get('feature_table.mag_x')}</th>
                    <th className='th number'>{get('feature_table.mag_y')}</th>
                    <th className='th number'>{get('feature_table.mag_z')}</th>
                    <th className='th number'>{get('feature_table.rc_temperature')}</th>
                    <th className='th ctrls'> </th>
                </tr>
            </thead>

            <tbody className='tbody'>
                {localFeatures
                    .slice() // Create a copy of the array to avoid mutating the original array
                    .sort((a, b) => {
                        if (a.search_score) {
                            if (a.search_score < b.search_score) return -1; // Sort a before b
                            if (a.search_score > b.search_score) return 1;
                        }
                        if (a.datetime < b.datetime) return -1;
                        if (a.datetime > b.datetime) return 1;
                        return 0; // Leave them unchanged in order
                    })
                    .map((feature: any, index: number) => (

                        <tr className={getRowClass(feature.properties.id)}
                            ref={feature.properties.id === selectionId ? selectedRowRef : null}
                            key={index} id={getRowId(feature.properties.id)}
                            onClick={() => handleClickRow(feature.properties.id)}
                        >
                            <td className='td datetime'>
                                {new Intl.DateTimeFormat(config.locale, {
                                    year: undefined,
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                }).format(new Date(feature.properties.timestamp))}
                            </td>
                            <td className='td number'>{feature.properties.mag_x}</td>
                            <td className='td number'>{feature.properties.mag_y}</td>
                            <td className='td number'>{feature.properties.mag_z}</td>
                            <td className='td number'>{feature.properties.rc_temperature}</td>
                            <td className='td ctrls'>
                                <span className='ctrl row-goto-map' onClick={() => showPointOnMap(feature)} />
                                <Link className='ctrl row-goto-details' to={'/sighting/' + feature.properties.id} />
                            </td>
                        </tr>
                    ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;

