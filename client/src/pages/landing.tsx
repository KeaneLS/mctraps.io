import React from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import Navbar from '../components/Navbar';
import TrapList from '../components/list';
import Popup from '../components/popup';
import { useAuth } from '../firebase/authContext';

const Landing: React.FC = () => {
  const [mode, setMode] = React.useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('themeMode') as AppThemeMode | null;
        if (stored === 'light' || stored === 'dark') return stored;
      } catch {}
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    }
    return 'light';
  });
  const currentTheme = mode === 'light' ? lightTheme : darkTheme;
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', mode);
    } catch {}
  }, [mode]);

  const { currentUser } = useAuth();
  const [showSignup, setShowSignup] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (currentUser) {
      setShowSignup(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSignup(true), 5000);
    return () => window.clearTimeout(timer);
  }, [currentUser]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />
      <TrapList />
      <Popup open={showSignup && !currentUser} onClose={() => setShowSignup(false)} />
    </ThemeProvider>
  );
};

export default Landing;


