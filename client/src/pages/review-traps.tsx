import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import Navbar from '../components/Navbar';
import { useAuth } from '../firebase/authContext';

const ReviewTraps: React.FC = () => {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Navbar />
        </ThemeProvider>
    );
};

export default ReviewTraps;