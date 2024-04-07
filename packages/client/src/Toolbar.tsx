// Toolbar.tsx
import React from 'react';

import ReportCount from './Toolbar/Status'
import DonwloadCsvButton from './Toolbar/DonwloadCsvButton';
import DateTime from './Toolbar/DateTime';
// import Dimensions from './Toolbar/Dimensions';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCount />
        {/* <Dimensions /> */}
        <DateTime />
        <DonwloadCsvButton />
    </nav>)
}

export default Toolbar;