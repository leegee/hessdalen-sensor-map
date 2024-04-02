import React, { useEffect, useRef, useState } from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { RootState } from './redux/store';
import Map from './Map';
import ResultsPanel from './ResultsPanel';
import Toolbar from './Toolbar';
import Modal from './Modal';
import About from './Modal/About';
import Contact from './Modal/Contact';
import Histogram from './Histogram';
import SightingDetails from './SightingDetails';

import './App.css';

function setScreenSizeClass() {
  if (window.innerWidth < 768) {
    document.body.classList.add('SMALL-SCREEN');
    document.body.classList.remove('LARGER-SCREEN');
  } else {
    document.body.classList.remove('SMALL-SCREEN');
    document.body.classList.add('LARGER-SCREEN');
  }
}

const App: React.FC = () => {
  const appElementRef = useRef<HTMLDivElement>(null);
  const [appClasses, setAppClasses] = useState('');
  const { panel } = useSelector((state: RootState) => state.gui);

  useEffect(() => {
    window.addEventListener('resize', setScreenSizeClass);
    setScreenSizeClass();
    return () => window.removeEventListener('resize', setScreenSizeClass);
  }, []);

  useEffect(() => {
    let widthClass = '';
    if (panel === 'full') {
      widthClass = 'REPORT_FULL_WIDTH';
    } else if (panel === 'narrow') {
      widthClass = 'REPORT_NARROW_WIDTH';
    }
    setAppClasses(widthClass + ' panel-is-' + panel);
  }, [panel])

  return (
    <main ref={appElementRef} className={appClasses}>
      <BrowserRouter>
        <>
          <Routes>
            <Route path="/about" element={<Modal><About /></Modal>} />
            <Route path="/contact" element={<Modal><Contact /></Modal>} />
            <Route path="/sighting/:id" element={<SightingDetails />} />
            <Route path="/histogram/dates" element={<Histogram />} />
            <Route path="/" element={<span />} />{/* noop */}
          </Routes>

          <Toolbar />
          <div className='map-panel-container'>
            <Map />
            <ResultsPanel />
          </div>
        </>
      </BrowserRouter>
    </main>
  );
}

export default App;

