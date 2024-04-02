import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import Modal from './Modal';
import { RootState } from './redux/store';
import { fetchSightingDetails } from './redux/details';

import './SightingDetails.css';

const SightingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const { loading, error, details } = useSelector((state: RootState) => state.details);

    useEffect(() => {
        dispatch(fetchSightingDetails(id));
    }, [dispatch, id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <Modal title={get('sighting_details.title') + ' ' + id}>
            <section id='sighting-details'>
                <table>
                    <tbody>
                        {Object.keys(details)
                            .filter((column: string) => column !== 'point' && details[column] !== null)
                            .map((column: string, index: number) => (
                                <tr key={index}>
                                    <th>{column}</th>
                                    <td>{details[column]?.toString()}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </section >
        </Modal >
    );
};

export default SightingDetails;
