import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './firebase/authContext';
import { GlobalStyles } from '@mui/material';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GlobalStyles styles={{ html: { overflowY: 'scroll' } }} />
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);