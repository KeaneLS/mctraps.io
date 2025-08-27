import React from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Link,
  TextField,
  Button,
  Divider,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import { alpha, Theme, useTheme } from '@mui/material/styles';
import Logo from '../components/icons/logo';
import Navbar from '../components/Navbar';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';

export interface LoginProps {
  isSignup?: boolean;
  embedded?: boolean;
  isReset?: boolean;
}

const Login: React.FC<LoginProps> = ({ isSignup: isSignupProp, embedded, isReset }) => {
  const themeForEmbedded = useTheme();
  const [mode, setMode] = React.useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('themeMode') as AppThemeMode | null;
        if (stored === 'light' || stored === 'dark') return stored;
      } catch {}
      if (window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
    }
    return 'light';
  });

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;
  const oppositeTheme = mode === 'light' ? darkTheme : lightTheme;
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', mode);
    } catch {}
  }, [mode]);

  const outlinedLightSx = (theme: Theme) => ({
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: alpha(theme.palette.light.main, 0.35) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.light.main, 0.55) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.light.main },
    },
  });
  
  // State
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSignup, setIsSignup] = React.useState<boolean>(!!isSignupProp);
  const canToggleMode = typeof isSignupProp === 'undefined';
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [resetSent, setResetSent] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const navigate = useNavigate();
  const { signup, login, loginWithGoogle, resetPassword } = useAuth();

  React.useEffect(() => {
    if (typeof isSignupProp === 'boolean') {
      setIsSignup(isSignupProp);
    }
  }, [isSignupProp]);

  React.useEffect(() => {
    setError(null);
    setInfo(null);
    setIsSubmitting(false);
  }, [isSignup, isReset]);

  const targetPath = isSignup ? '/login' : '/signup';

  const isResetMode = !!isReset;

  // Place formatter before any early returns so it is initialized in embedded variant too
  function formatAuthError(err: any): string {
    const rawCode = (err?.code as string | undefined) || '';
    const code = rawCode.toLowerCase();

    const friendlyByCode: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account exists for that email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/missing-password': 'Please enter your password.',
      'auth/missing-email': 'Please enter your email address.',
      'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/invalid-login-credentials': 'Email or password is incorrect.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.',
      'auth/internal-error': 'An unexpected error occurred. Please try again.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled.',
      'auth/popup-blocked': 'Your browser blocked the sign-in pop-up. Please allow pop-ups and try again.',
      'auth/popup-closed-by-user': 'Log in was cancelled. Please try again.',
      'auth/cancelled-popup-request': 'Log in was cancelled. Please try again.',
    };

    if (friendlyByCode[code]) return friendlyByCode[code];

    const raw = (err?.message as string | undefined) || 'Something went wrong. Please try again.';
    const withoutFirebase = raw.replace(/^Firebase:\s*(Error\s*)?/i, '').trim();
    const withoutCode = withoutFirebase.replace(/\s*\(auth\/[\w-]+\)\.?$/i, '').trim();

    const cleaned = withoutCode || friendlyByCode[code] || 'Something went wrong. Please try again.';
    return /[\.!?]$/.test(cleaned) ? cleaned : cleaned + '.';
  }

  if (embedded) {
    return (
        <Box sx={{ pt: 0, pb: { xs: 3, sm: 4 }, px: { xs: 3, sm: 4 }, width: '100%', maxWidth: 520 }}>
          <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>

            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (resetSent) setResetSent(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isResetMode && !resetSent) {
                    e.preventDefault();
                    handleForgotPassword();
                  }
                }}
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                sx={outlinedLightSx(themeForEmbedded)}
              />

              {!isSignup && !isResetMode && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link component={RouterLink} to="/reset" className="link" underline="none" color="light.main" variant="body2" onClick={() => { setError(null); setInfo(null); }}>
                    Forgot password?
                  </Link>
                </Box>
              )}
              {!isResetMode && (
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                FormHelperTextProps={isSignup ? undefined : { sx: { color: 'light.main' } }}
                sx={outlinedLightSx(themeForEmbedded)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        color="light"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />)}

              {error && (
                <Typography variant="body2" sx={{ mt: 1, color: (theme) => theme.palette.light.main }}>
                  {error}
                </Typography>
              )}
              {info && (
                <Typography variant="body2" sx={{ mt: 1, color: (theme) => theme.palette.light.main }}>
                  {info}
                </Typography>
              )}

              <Button
                variant="outlined"
                color="brand"
                size="large"
                fullWidth
                sx={{
                  height: 52,
                  px: 2,
                  color: 'dark.main',
                  position: 'relative',
                  overflow: 'hidden',
                  border: `1px solid ${alpha(themeForEmbedded.palette.brand.main, 0.45)}`,
                  bgcolor: themeForEmbedded.palette.brand.main,
                  boxShadow: 'none',
                  textTransform: 'none',
                  transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    borderColor: alpha(themeForEmbedded.palette.brand.main, 0.6),
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${alpha(themeForEmbedded.palette.brand.main, 0.6)}`,
                    outlineOffset: '2px',
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(themeForEmbedded.palette.light.main, 0.14),
                    borderColor: alpha(themeForEmbedded.palette.light.main, 0.18),
                    color: themeForEmbedded.palette.light.main,
                    transform: 'none',
                  },
                }}
                onClick={isResetMode ? handleForgotPassword : handleSubmit}
                disabled={isResetMode ? (resetSent || isSubmitting) : isSubmitting}
              >
                {isResetMode ? 'Reset Password' : (isSignup ? 'Create account' : 'Log in')}
              </Button>

              {!isResetMode && (<Divider>OR</Divider>)}

              {!isResetMode && (
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<Google />}
                color="inherit"
                sx={{
                  height: 52,
                  px: 2,
                  borderColor: alpha(themeForEmbedded.palette.light.main, 0.12),
                  bgcolor: alpha(themeForEmbedded.palette.light.main, 0.04),
                  textTransform: 'none',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(themeForEmbedded.palette.light.main, 0.1),
                    borderColor: alpha(themeForEmbedded.palette.light.main, 0.2),
                    transform: 'translateY(-1px)',
                  },
                }}
                onClick={handleGoogleAuth}
              >
                {isSignup ? 'Sign up with Google' : 'Log in with Google'}
              </Button>)}

              {isSignup && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: alpha(themeForEmbedded.palette.light.main, 0.7) }}>
                  By signing up, I agree to the{' '}
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">Terms of Service</Typography> and{' '}
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">Privacy Policy</Typography>
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
    );
  }

  // Handle form submit
  async function handleSubmit() {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setError(null);
      setInfo(null);
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/home');
    } catch (err: any) {
      setError(formatAuthError(err));
      console.log("Error signing in:", err.message);
      console.log("login info:", email, password);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Google login
  async function handleGoogleAuth() {
    if (isSubmitting) return;
    try {
      setError(null);
      setInfo(null);
      await loginWithGoogle();
      navigate('/home');
    } catch (err: any) {
      setError(formatAuthError(err));
      console.log("Error signing in:", err.message);
    }
  }

  async function handleForgotPassword() {
    if (isSubmitting || resetSent) return;
    try {
      setIsSubmitting(true);
      setError(null);
      setInfo(null);
      if (!email) {
        setError('Enter your email to reset password.');
        return;
      }
      try {
        await resetPassword(email);
      } catch (err: any) {
        const code = err?.code as string | undefined;
        if (code === 'auth/user-not-found' || code === 'auth/too-many-requests') {
        } else if (code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
          return;
        } else {
          setError(formatAuthError(err));
          return;
        }
      }
      setInfo("If an account exists for that email, we've sent a reset link. Make sure to check your junk/spam folder.");
      setResetSent(true);
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box
          sx={{
            width: { md: 380, lg: 450, xl: 500 },
            maxWidth: '100%',
            gap: 2,
            p: { xs: 6, md: 8 },
            bgcolor: currentTheme.palette.light.main,
            color: 'light.main',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 1,
          }}
        >
            <Box>
                <Typography variant="h4" align="center" color="dark.main" gutterBottom>
                Enter the Trapverse.
                </Typography>
                <Typography variant="body1" align="center" color="dark.main" sx={{ opacity: 0.9, mb: 2 }}>
                Got traps to share? Ready to discover more? MCTraps is your ultimate toolkit for creating and learning.
                </Typography>
            </Box>
            <Logo theme={oppositeTheme} width={300} height={300} />
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'grid',
            placeItems: 'center',
            p: { xs: 6, md: 8 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 440 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {isResetMode ? 'Reset your password' : (isSignup ? 'Sign up for free, forever' : 'Log in to your account')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4 }}>
              {isResetMode ? 'Enter your email to receive a reset link.' : (isSignup ? 'Already have an account?' : "Don't have an account?")}{' '}
              <Link
                component={RouterLink}
                to={isResetMode ? '/login' : targetPath}
                sx={{ ml: 0.3, fontWeight: 'bold' }}
                className="link"
                underline="none"
                onClick={(e: React.MouseEvent) => {
                  if (isResetMode) return;
                  if (canToggleMode) {
                    e.preventDefault();
                    setError(null);
                    setInfo(null);
                    setIsSignup((prev) => !prev);
                  }
                }}
              >
                {isResetMode ? 'Back to Log in' : 'Get started'}
              </Link>
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (resetSent) setResetSent(false); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isResetMode && !resetSent) {
                    e.preventDefault();
                    handleForgotPassword();
                  }
                }}
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                sx={outlinedLightSx(currentTheme)}
              />

              {!isSignup && !isResetMode && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link component={RouterLink} to="/reset" className="link" underline="none" color="light.main" variant="body2" onClick={() => { setError(null); setInfo(null); }}>
                    Forgot password?
                  </Link>
                </Box>
              )}
              {!isResetMode && (
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                FormHelperTextProps={isSignup ? undefined : { sx: { color: 'light.main' } }}
                sx={outlinedLightSx(currentTheme)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        color="light"
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />)}

              {error && (
                <Typography variant="body2" sx={{ mt: 1, color: (theme) => theme.palette.light.main }}>
                  {error}
                </Typography>
              )}
              {info && (
                <Typography variant="body2" sx={{ mt: 1, color: (theme) => theme.palette.light.main }}>
                  {info}
                </Typography>
              )}

              <Button
                variant="outlined"
                color="brand"
                size="large"
                fullWidth
                sx={{
                  height: 52,
                  px: 2,
                  color: 'dark.main',
                  position: 'relative',
                  overflow: 'hidden',
                  border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                  bgcolor: currentTheme.palette.brand.main,
                  boxShadow: 'none',
                  textTransform: 'none',
                  transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    borderColor: alpha(currentTheme.palette.brand.main, 0.6),
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${alpha(currentTheme.palette.brand.main, 0.6)}`,
                    outlineOffset: '2px',
                  },
                  '&.Mui-disabled': {
                    bgcolor: alpha(currentTheme.palette.light.main, 0.14),
                    borderColor: alpha(currentTheme.palette.light.main, 0.18),
                    color: currentTheme.palette.light.main,
                    transform: 'none',
                  },
                }}
                onClick={isResetMode ? handleForgotPassword : handleSubmit}
                disabled={isResetMode ? (resetSent || isSubmitting) : isSubmitting}
              >
                {isResetMode ? 'Reset Password' : (isSignup ? 'Create account' : 'Log in')}
              </Button>

              {!isResetMode && (<Divider>OR</Divider>)}

              {!isResetMode && (
              <Button
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<Google />}
                color="inherit"
                sx={{
                  height: 52,
                  px: 2,
                  borderColor: alpha(currentTheme.palette.light.main, 0.12),
                  bgcolor: alpha(currentTheme.palette.light.main, 0.04),
                  textTransform: 'none',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(currentTheme.palette.light.main, 0.1),
                    borderColor: alpha(currentTheme.palette.light.main, 0.2),
                    transform: 'translateY(-1px)',
                  },
                }}
                onClick={handleGoogleAuth}
              >
                {isSignup ? 'Sign up with Google' : 'Log in with Google'}
              </Button>)}

              {isSignup && (
                <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: alpha(currentTheme.palette.light.main, 0.7) }}>
                  By signing up, I agree to the{' '}
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">Terms of Service</Typography> and{' '}
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">Privacy Policy</Typography>
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Login;


