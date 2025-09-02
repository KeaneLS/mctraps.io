import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme, AppThemeMode } from './theme';
import Landing from './pages/landing';
import Login from './pages/login';
import AccountPage from './pages/account';
import CoalesceController from './components/CoalesceController';
import ReviewTraps from './pages/review-traps';
import DiscordCallback from './pages/discord-callback';
import TrapDetailsPage from './pages/trap-details';

const App: React.FC = () => {
  const [mode, setMode] = React.useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('themeMode') as AppThemeMode | null;
        if (stored === 'light' || stored === 'dark') return stored;
      } catch {}
    }
    return 'dark';
  });

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'themeMode' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setMode(e.newValue as AppThemeMode);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <BrowserRouter>
        <CoalesceController active={true} />
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Landing />} />
          <Route path="/login" element={<Login isSignup={false} />} />
          <Route path="/signup" element={<Login isSignup={true} />} />
          <Route path="/reset" element={<Login isSignup={false} isReset={true} />} />
          <Route path="/profile" element={<AccountPage />} />
          <Route path="/review-traps" element={<ReviewTraps />} />
          <Route path="/auth/discord/callback" element={<DiscordCallback />} />
          <Route path="/trap/:id" element={<TrapDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;


