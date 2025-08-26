import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './pages/landing';
import Login from './pages/login';
import Popup from './components/popup';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Landing />
  </React.StrictMode>
);