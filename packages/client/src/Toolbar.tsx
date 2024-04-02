// Toolbar.tsx
import React from 'react';

import ReportCount from './Toolbar/Status'
import DonwloadCsvButton from './Toolbar/DonwloadCsvButton';
import ReportButton from './Toolbar/ReportButton';
import DateTime from './Toolbar/DateTime';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCount />
        <DateTime />
        <ReportButton />
        <DonwloadCsvButton />
    </nav>)
}

export default Toolbar;