import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import Navbar from '../components/Navbar';
import TrapList from '../components/list';
import Popup from '../components/popup';

const Landing: React.FC = () => {
  const [mode, setMode] = React.useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const currentTheme = mode === 'light' ? lightTheme : darkTheme;
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const [showSignup, setShowSignup] = React.useState<boolean>(false);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setShowSignup(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />
      <TrapList />
      <Popup open={showSignup} onClose={() => setShowSignup(false)} />
    </ThemeProvider>
  );
};

export default Landing;


