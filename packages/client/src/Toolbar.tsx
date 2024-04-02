// Toolbar.tsx
import React from 'react';

import ReportCount from './Toolbar/Status'
import DonwloadCsvButton from './Toolbar/DonwloadCsvButton';
import ReportButton from './Toolbar/ReportButton';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCount />
        <ReportButton />
        <DonwloadCsvButton />
    </nav>)
}

export default Toolbar;