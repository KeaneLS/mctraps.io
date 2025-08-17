import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from '../theme';
import Navbar from '../components/Navbar';

const Landing: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <Box sx={{ height: 96 }} />
    </ThemeProvider>
  );
};

export default Landing;


