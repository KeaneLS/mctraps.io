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
  SvgIcon,
} from '@mui/material';
import { Google, Visibility, VisibilityOff } from '@mui/icons-material';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import { alpha, Theme, useTheme } from '@mui/material/styles';
import Logo from '../components/icons/logo';
import Navbar from '../components/Navbar';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/authContext';
import { verifyDiscordCloud } from '../firebase/authentication';

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
    }
    return 'dark';
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
  const { signup, login, loginWithGoogle, resetPassword, reloadUser } = useAuth();
  const verifyingDiscordRef = React.useRef<boolean>(false);

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

  const DiscordIcon: React.FC<React.ComponentProps<typeof SvgIcon>> = (props) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.07.07 0 00-.073.035c-.21.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.405-.874-.617-1.249a.07.07 0 00-.073-.035A19.736 19.736 0 003.677 4.37a.064.064 0 00-.032.027C.533 9.046-.32 13.58.099 18.061a.074.074 0 00.028.052 19.9 19.9 0 005.993 3.03.07.07 0 00.075-.026c.461-.63.873-1.295 1.226-1.994a.07.07 0 00-.038-.098 12.793 12.793 0 01-1.81-.86.07.07 0 01-.007-.118c.122-.091.244-.186.361-.282a.07.07 0 01.073-.01c3.802 1.742 7.915 1.742 11.676 0a.07.07 0 01.074.009c.117.096.239.192.362.283a.07.07 0 01-.006.118 12.3 12.3 0 01-1.81.86.07.07 0 00-.037.098c.36.699.772 1.365 1.225 1.994a.07.07 0 00.076.026 19.9 19.9 0 005.993-3.03.07.07 0 00.028-.052c.5-5.177-.838-9.674-3.548-13.665a.056.056 0 00-.031-.027zM8.02 15.33c-1.146 0-2.087-1.053-2.087-2.35 0-1.296.925-2.35 2.087-2.35 1.17 0 2.105 1.06 2.087 2.35 0 1.297-.925 2.35-2.087 2.35zm7.975 0c-1.146 0-2.087-1.053-2.087-2.35 0-1.296.925-2.35 2.087-2.35 1.17 0 2.105 1.06 2.087 2.35 0 1.297-.925 2.35-2.087 2.35z" />
    </SvgIcon>
  );

  function openCenteredPopup(
    url: string,
    title: string,
    width = 500,
    height = 650
  ) {
    if (!url) return null;
    const dualScreenLeft = (window as any).screenLeft !== undefined ? (window as any).screenLeft : (window as any).screenX;
    const dualScreenTop = (window as any).screenTop !== undefined ? (window as any).screenTop : (window as any).screenY;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || (window.screen ? window.screen.width : 0);
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || (window.screen ? window.screen.height : 0);
    const left = Math.max(0, dualScreenLeft + (viewportWidth - width) / 2);
    const top = Math.max(0, dualScreenTop + (viewportHeight - height) / 2);
    const features = `scrollbars=yes,width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,resizable=yes`;
    const popup = window.open(url, title, features);
    if (!popup) return null;
    try { popup.focus(); } catch {}
    return popup;
  }

  function base64UrlEncode(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function generateRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  }

  function generateState(): string {
    return base64UrlEncode(generateRandomBytes(32).buffer);
  }

  function generateCodeVerifier(): string {
    const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const bytes = generateRandomBytes(64);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      out += allowed.charAt(bytes[i] % allowed.length);
    }
    return out;
  }

  async function generateCodeChallenge(verifier: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  async function handleDiscordAuth() {
    if (isSubmitting) return;
    const clientId = (process.env.REACT_APP_DISCORD_CLIENT_ID as string) || '';
    if (!clientId) {
      setError('Discord login is not configured.');
      return;
    }
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    const state = `auth:${isSignup ? 'signup' : 'login'}:${generateState()}`;
    const codeVerifier = generateCodeVerifier();
    let codeChallenge = '';
    try {
      codeChallenge = await generateCodeChallenge(codeVerifier);
    } catch {
      setError('Your browser does not support required crypto APIs.');
      return;
    }
    try { window.localStorage.setItem('discord_oauth_state', state); } catch {}
    try { window.localStorage.setItem('discord_code_verifier', codeVerifier); } catch {}
    try { window.localStorage.setItem('discordAuthPending', '1'); } catch {}
    try { window.localStorage.setItem('discordAuthIntent', isSignup ? 'signup' : 'login'); } catch {}
    try {
      const user = (await import('../firebase/config')).auth.currentUser;
      if (user?.uid) window.localStorage.setItem('discord_verify_uid', user.uid);
    } catch {}

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'identify email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
    const popup = openCenteredPopup(url, 'Discord Login');
    if (!popup) {
      setError('Your browser blocked the sign-in popup. Please allow popups.');
      try { window.localStorage.removeItem('discordAuthPending'); } catch {}
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    async function maybeVerifyAndInvite() {
      if (verifyingDiscordRef.current) return;
      const pending = (() => {
        try { return window.localStorage.getItem('discordAuthPending') === '1'; } catch { return false; }
      })();
      const ready = (() => {
        try { return window.localStorage.getItem('discordAuthReady') === '1'; } catch { return false; }
      })();
      if (!pending || !ready) return;
      try {
        verifyingDiscordRef.current = true;
        const user = (await import('../firebase/config')).auth.currentUser;
        if (!user || user.isAnonymous) return;
        await verifyDiscordCloud({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        let intent: string | null = null;
        try { intent = window.localStorage.getItem('discordAuthIntent'); } catch {}
        try { window.localStorage.removeItem('discordAuthPending'); } catch {}
        try { window.localStorage.removeItem('discordAuthIntent'); } catch {}
        try { window.localStorage.removeItem('discordAuthReady'); } catch {}
        if (!cancelled) {
          navigate(intent === 'signup' ? '/profile' : '/home');
        }
      } catch (e) {
      } finally {
        verifyingDiscordRef.current = false;
      }
    }
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const data: any = ev?.data;
      if (data && data.type === 'discord-auth-complete') {
        (async () => {
          try { window.localStorage.setItem('discordAuthReady', '1'); } catch {}
          try { await reloadUser(); } catch {}
          try {
            const discordUsername: string | null | undefined = data?.profile?.discordUsername;
            if (discordUsername) {
              try { await verifyDiscordCloud({ discordUsername }); } catch {}
            }
            await maybeVerifyAndInvite();
          } catch {}
          try { window.localStorage.removeItem('discord_verify_uid'); } catch {}
        })();
      } else if (data && data.type === 'discord-auth-error') {
        const code = (data as any)?.code as string | undefined;
        const msg = (data as any)?.error as string | undefined;
        if (code === 'already-exists' || msg === 'discord_already_linked') {
          setError('Discord account is already linked to another account.');
        } else {
          setError('Discord sign-in failed. Please try again.');
        }
        try { window.localStorage.removeItem('discordAuthPending'); } catch {}
        try { window.localStorage.removeItem('discordAuthIntent'); } catch {}
        try { window.localStorage.removeItem('discordAuthReady'); } catch {}
        try { window.localStorage.removeItem('discord_verify_uid'); } catch {}
      }
    }
    window.addEventListener('message', onMessage);
    const id = setInterval(maybeVerifyAndInvite, 600);
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('message', onMessage); };
  }, [isSignup, navigate]);

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
                inputProps={{ maxLength: 254 }}
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
                inputProps={{ maxLength: 128 }}
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
              <>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<DiscordIcon />}
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
                  onClick={handleDiscordAuth}
                >
                  {isSignup ? 'Sign up with Discord' : 'Log in with Discord'}
                </Button>

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
                </Button>
              </>
              )}

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

  async function handleSubmit() {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setError(null);
      setInfo(null);
      if (isSignup) {
        await signup(email, password);
        try { await reloadUser(); } catch {}
        navigate('/profile');
      } else {
        await login(email, password);
        try { await reloadUser(); } catch {}
        navigate('/home');
      }
    } catch (err: any) {
      setError(formatAuthError(err));
      try {
        console.log("Error signing in:", err?.message || err);
      } catch {}
      try {
        console.log("login info:", email, password);
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    if (isSubmitting) return;
    try {
      setError(null);
      setInfo(null);
      await loginWithGoogle();
      try { await reloadUser(); } catch {}
      navigate(isSignup ? '/profile' : '/home');
    } catch (err: any) {
      setError(formatAuthError(err));
      try { console.log("Error signing in:", err?.message || err); } catch {}
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
                inputProps={{ maxLength: 254 }}
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
                inputProps={{ maxLength: 128 }}
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
              <>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<DiscordIcon />}
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
                  onClick={handleDiscordAuth}
                >
                  {isSignup ? 'Sign up with Discord' : 'Log in with Discord'}
                </Button>

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
                </Button>
              </>
              )}

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


