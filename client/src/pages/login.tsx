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
import { signupWithEmail, loginWithEmail, loginWithGoogle } from "../firebase/authentication";

export interface LoginProps {
  isSignup?: boolean;
  embedded?: boolean;
}

const Login: React.FC<LoginProps> = ({ isSignup: isSignupProp, embedded }) => {
  const themeForEmbedded = useTheme();
  const [mode, setMode] = React.useState<AppThemeMode>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;
  const oppositeTheme = mode === 'light' ? darkTheme : lightTheme;
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

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
  const [username, setUsername] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof isSignupProp === 'boolean') {
      setIsSignup(isSignupProp);
    }
  }, [isSignupProp]);

  if (embedded) {
    return (
        <Box sx={{ pt: 0, pb: { xs: 3, sm: 4 }, px: { xs: 3, sm: 4 }, width: '100%', maxWidth: 520 }}>
          <Box sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>

            <Stack spacing={2.5}>
              {isSignup && (
                <TextField
                  label="Username"
                  type="text"
                  fullWidth
                  InputLabelProps={{
                    sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                  }}
                  sx={outlinedLightSx(themeForEmbedded)}
                />
              )}
              <TextField
                label="Email address"
                type="email"
                fullWidth
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                sx={outlinedLightSx(themeForEmbedded)}
              />

              {!isSignup && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">
                    Forgot password?
                  </Typography>
                </Box>
              )}
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
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
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

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
                }}
              >
                {isSignup ? 'Create account' : 'Sign in'}
              </Button>

              <Divider>OR</Divider>

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
              >
                {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
              </Button>

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
  const handleSubmit = async () => {
    try {
      if (isSignup) {
        await signupWithEmail(email, password, username);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message);
      console.log("Error signing in:", err.message)
      console.log("login info:", email, password, username)
    }
  };

  // Handle Google login
  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message);
      console.log("Error signing in:", err.messager)
    }
  };

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
              {isSignup ? 'Sign up for free, forever' : 'Sign in to your account'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 4 }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Typography
                component={Link}
                variant="body2"
                sx={{ ml: 0.3, fontWeight: 'bold' }}
                href="#"
                className="link"
                underline="none"
                onClick={(e) => {
                  e.preventDefault();
                  if (canToggleMode) setIsSignup((prev) => !prev);
                }}
              >
                Get started
              </Typography>
            </Typography>

            <Stack spacing={2.5}>
              {isSignup && (
                <TextField
                  label="Username"
                  type="text"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  InputLabelProps={{
                    sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                  }}
                  sx={outlinedLightSx(currentTheme)}
                />
              )}
              <TextField
                label="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputLabelProps={{
                  sx: { color: 'light.main', '&.Mui-focused': { color: 'light.main' } },
                }}
                sx={outlinedLightSx(currentTheme)}
              />

              {!isSignup && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Typography component={Link} href="#" className="link" underline="none" color="light.main" variant="body2">
                    Forgot password?
                  </Typography>
                </Box>
              )}
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
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
                }}
                onClick={handleSubmit}
              >
                {isSignup ? 'Create account' : 'Sign in'}
              </Button>

              <Divider>OR</Divider>

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
                {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
              </Button>

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


