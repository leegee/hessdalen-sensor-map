import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import { get } from 'react-intl-universal';

import config from '@hessdalen-sensor-map/config/src';
import { RootState } from './redux/store';
import { setPanel, setSelectionId } from './redux/guiSlice';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.min.css';
import './FeatureTable.css';

const FeatureTable: React.FC = () => {
    const dispatch = useDispatch();
    const { featureCollection } = useSelector((state: RootState) => state.map);
    // const { selectionId } = useSelector((state: RootState) => state.gui);
    const gridRef = useRef<AgGridReact>(null);

    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.addEventListener('rowClicked', (event: CustomEvent) => {
                dispatch(setSelectionId((event.data).id));
            });
        }
    }, [dispatch]);

    const ActionsRenderer = (props: any) => (
        <>
            <span className='ctrl row-goto-map' onClick={() => props.onMapClick(props.data.id)} />
            <Link className='ctrl row-goto-details' to={props.onDetailsClick(props.data.id)} />
        </>
    );

    const onGridReady = (params: any) => {
        params.api.cellRendererService.registerRenderer('actionsRenderer', ActionsRenderer);
    };

    const columnDefs = [
        {
            headerName: get('feature_table.date'),
            field: 'timestamp',
            valueFormatter: (params: any) => {
                if (params.value) {
                    return new Intl.DateTimeFormat(config.locale, {
                        year: undefined,
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }).format(new Date(String(params.value)));
                }
                return '';
            }
        },
        { headerName: get('feature_table.mag_x'), field: 'mag_x', type: 'number', valueFormatter: (params: any) => params.value.toFixed(4) },
        { headerName: get('feature_table.mag_y'), field: 'mag_y', type: 'number', valueFormatter: (params: any) => params.value.toFixed(4) },
        { headerName: get('feature_table.mag_z'), field: 'mag_z', type: 'number', valueFormatter: (params: any) => params.value.toFixed(4) },
        { headerName: get('feature_table.rc_temperature'), field: 'rc_temperature', type: 'number', valueFormatter: (params: any) => params.value.toFixed(4) },
        {
            headerName: '',
            cellRenderer: 'actionsRenderer',
            cellRendererParams: {
                onMapClick: (id: number) => {
                    dispatch(setPanel('narrow'));
                    dispatch(setSelectionId(id));
                },
                onDetailsClick: (id: number) => `/sighting/${id}`
            }
        }
    ];

    const defaultColDef = {
        sortable: true,
        resizable: true,
        flex: 1
    };

    const rowData = featureCollection?.features.map((feature: any) => ({
        ...feature.properties,
        id: feature.properties.id
    })) || [];

    return (
        <div className="ag-theme-quartz-auto-dark" style={{ height: '95%', width: '100%' }}>
            {rowData.length ?
                <AgGridReact
                    ref={gridRef}
                    columnDefs={columnDefs}
                    rowData={rowData}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                ></AgGridReact>
                : ''
            }
        </div>
    );
};

export default FeatureTable;
