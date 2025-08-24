import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme, { darkTheme, lightTheme, AppThemeMode } from '../theme';
import Navbar from '../components/Navbar';
import TrapList from '../components/list';

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

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />
      <TrapList />
    </ThemeProvider>
  );
};

export default Landing;


