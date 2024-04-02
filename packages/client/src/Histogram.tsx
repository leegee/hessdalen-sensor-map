/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { Bar } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';

import { selectPointsCount } from './redux/mapSlice';
import { RootState } from 'redux/store';
import Modal from './Modal';

import './Histogram.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Histogram: React.FC = () => {
    const pointsCount = useSelector(selectPointsCount);
    const { featureCollection } = useSelector((state: RootState) => state.map);
    const [yearOneCount, setYearOneCount] = useState(0);
    
    const [data, setData] = useState<any>(null);
    const [options, setOptions] = useState<any>(null);

    if (!pointsCount) {
        alert('no points')
    }

    useEffect(() => {
        if (!featureCollection?.features) return;

        const yearValues: number[] = featureCollection.features
            .map((feature: any) => new Date(feature.properties.datetime as string).getFullYear())
            .filter(year => {
                // Filter out year 1, which currently represents bad dates
                if (year === 1) {
                    setYearOneCount(yearOneCount + 1);
                }
                return year !== 1;
            });

        const lowestYear = Math.min(...yearValues);
        const highestYear = Math.max(...yearValues);

        const yearCount: Record<number, number> = {};

        yearValues.forEach(year => {
            yearCount[year] = (yearCount[year] || 0) + 1;
        });

        // Include the years without reports
        for (let year = lowestYear; year <= highestYear; year++) {
            if (!yearCount[year]) {
                yearCount[year] = 0;
            }
        }

        const newOptions = {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                    text: get('histogram.title'),
                },
            }
        };

        const newData = {
            labels: Object.keys(yearCount),
            datasets: [
                {
                    data: Object.values(yearCount),
                    backgroundColor: 'orange',
                },
            ],
        };

        setData(newData);
        setOptions(newOptions);
    }, [featureCollection, yearOneCount]);


    return pointsCount ? (
        <Modal title={get('histogram.title')}>
            <section>
                {data && <Bar data={data} options={options} />}
            </section>
        </Modal>
    ) : '';
};

export default Histogram;
