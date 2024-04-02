import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { store } from './redux/store';
import { setupLocale } from './LocaleManager';
import App from './App';

import './index.css';
import './App.css';

await setupLocale();

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
} else {
  console.error('Could not find #root');
}