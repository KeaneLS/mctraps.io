import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Typography } from '@mui/material';
import theme from './theme';
import Logo from './components/icons/logo';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Logo />
    </ThemeProvider>
  </React.StrictMode>
);