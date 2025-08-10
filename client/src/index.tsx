import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline, Typography } from '@mui/material';
import theme from './theme';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);



root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Typography variant="h1" color="brand">Colors and typography set up! - Keane</Typography>
    </ThemeProvider>
  </React.StrictMode>
);