import React from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Paper,
  Stack,
  Typography,
  Avatar,
  Button,
  TextField,
  SvgIcon,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Navbar from '../components/Navbar';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import { useAuth } from '../firebase/authContext';
import { AccountCircle, FileUpload, Logout, Check, VerifiedUser } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app, db } from '../firebase/config';
import { verifyDiscordCloud } from '../firebase/authentication';

const AccountPage: React.FC = () => {
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
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', mode);
    } catch {}
  }, [mode]);

  const { currentUser, logout, reloadUser } = useAuth();
  const initialUsername = currentUser?.displayName || '';
  const [username, setUsername] = React.useState<string>(initialUsername);
  const [isDirty, setIsDirty] = React.useState<boolean>(false);
  const initialPhoto = currentUser?.photoURL || currentUser?.providerData?.find(p => p.photoURL)?.photoURL || undefined;
  const [avatarPreview, setAvatarPreview] = React.useState<string | undefined>(initialPhoto);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [discordUsername, setDiscordUsername] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUsername(initialUsername);
    const nextPhoto = currentUser?.photoURL || currentUser?.providerData?.find(p => p.photoURL)?.photoURL || undefined;
    setAvatarPreview(nextPhoto);
    setAvatarFile(null);
    setIsDirty(false);
  }, [initialUsername, currentUser?.photoURL]);

  // Listen to Firestore user doc for discordUsername
  React.useEffect(() => {
    if (!currentUser?.uid) {
      setDiscordUsername(null);
      return;
    }
    const ref = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as { discordUsername?: string | null } | undefined;
      setDiscordUsername(data?.discordUsername ?? null);
    });
    return () => { try { unsub(); } catch {} };
  }, [currentUser?.uid]);

  React.useEffect(() => {
    const usernameDirty = username !== initialUsername;
    const avatarDirty = !!avatarFile;
    setIsDirty(usernameDirty || avatarDirty);
  }, [username, initialUsername, avatarFile]);

  const surfaceBg = alpha(currentTheme.palette.light.main, 0.06);
  const surfaceBorder = alpha(currentTheme.palette.light.main, 0.12);
  const hoverBg = alpha(currentTheme.palette.light.main, 0.1);

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setUsername(next);
    setIsDirty(next !== initialUsername);
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
  }

  async function handleSave() {
    if (!isDirty) return;
    if (!currentUser) return;
    try {
      const updates: { displayName?: string; photoURL?: string } = {};

      const trimmedUsername = username.trim();
      if (trimmedUsername && trimmedUsername !== initialUsername) {
        updates.displayName = trimmedUsername;
      }

      if (avatarFile) {
        const storage = getStorage(app);
        const avatarPath = `avatars/${currentUser.uid}`;
        const ref = storageRef(storage, avatarPath);
        await uploadBytes(ref, avatarFile, { contentType: avatarFile.type || 'image/jpeg' });
        const url = await getDownloadURL(ref);
        updates.photoURL = url;
        setAvatarPreview(url);
      }

      if (updates.displayName || updates.photoURL) {
        try {
          await updateProfile(currentUser, updates);
        } catch {}

        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          { ...updates, updatedAt: serverTimestamp() },
          { merge: true }
        );
        await reloadUser();
      }
    } finally {
      setAvatarFile(null);
      setIsDirty(false);
    }
  }

  const DiscordIcon: React.FC<React.ComponentProps<typeof SvgIcon>> = (props) => (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M20.317 4.369a19.791 19.791 0 00-4.885-1.515.07.07 0 00-.073.035c-.21.375-.444.864-.608 1.249-1.844-.276-3.68-.276-5.486 0-.164-.398-.405-.874-.617-1.249a.07.07 0 00-.073-.035A19.736 19.736 0 003.677 4.37a.064.064 0 00-.032.027C.533 9.046-.32 13.58.099 18.061a.074.074 0 00.028.052 19.9 19.9 0 005.993 3.03.07.07 0 00.075-.026c.461-.63.873-1.295 1.226-1.994a.07.07 0 00-.038-.098 12.793 12.793 0 01-1.81-.86.07.07 0 01-.007-.118c.122-.091.244-.186.361-.282a.07.07 0 01.073-.01c3.802 1.742 7.915 1.742 11.676 0a.07.07 0 01.074.009c.117.096.239.192.362.283a.07.07 0 01-.006.118 12.3 12.3 0 01-1.81.86.07.07 0 00-.037.098c.36.699.772 1.365 1.225 1.994a.07.07 0 00.076.026 19.9 19.9 0 005.993-3.03.07.07 0 00.028-.052c.5-5.177-.838-9.674-3.548-13.665a.056.056 0 00-.031-.027zM8.02 15.33c-1.146 0-2.087-1.053-2.087-2.35 0-1.296.925-2.35 2.087-2.35 1.17 0 2.105 1.06 2.087 2.35 0 1.297-.925 2.35-2.087 2.35zm7.975 0c-1.146 0-2.087-1.053-2.087-2.35 0-1.296.925-2.35 2.087-2.35 1.17 0 2.105 1.06 2.087 2.35 0 1.297-.925 2.35-2.087 2.35z" />
    </SvgIcon>
  );

  function openCenteredPopup(url: string, title: string, width = 500, height = 650) {
    if (!url) return;
    const dualScreenLeft = (window as any).screenLeft !== undefined ? (window as any).screenLeft : (window as any).screenX;
    const dualScreenTop = (window as any).screenTop !== undefined ? (window as any).screenTop : (window as any).screenY;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || (window.screen ? window.screen.width : 0);
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || (window.screen ? window.screen.height : 0);
    const left = Math.max(0, dualScreenLeft + (viewportWidth - width) / 2);
    const top = Math.max(0, dualScreenTop + (viewportHeight - height) / 2);
    const features = `scrollbars=yes,width=${width},height=${height},top=${top},left=${left},toolbar=no,location=no,status=no,menubar=no,resizable=yes`;
    const popup = window.open(url, title, features);
    if (!popup) {
      window.location.href = url;
      return;
    }
    try { popup.focus(); } catch {}
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
    for (let i = 0; i < bytes.length; i++) out += allowed.charAt(bytes[i] % allowed.length);
    return out;
  }
  async function generateCodeChallenge(verifier: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  }

  async function handleDiscordAuth() {
    const clientId = (process.env.REACT_APP_DISCORD_CLIENT_ID as string) || '';
    if (!clientId) return;
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    const state = `verify:${generateState()}`;
    const codeVerifier = generateCodeVerifier();
    let codeChallenge = '';
    try {
      codeChallenge = await generateCodeChallenge(codeVerifier);
    } catch { return; }
    try { window.localStorage.setItem('discord_oauth_state', state); } catch {}
    try { window.localStorage.setItem('discord_code_verifier', codeVerifier); } catch {}
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
    openCenteredPopup(url, 'Discord Login');
  }

  React.useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const data: any = ev?.data;
      if (data && data.type === 'discord-auth-complete') {
        const discordUsername: string | null | undefined = data?.profile?.discordUsername;
        (async () => {
          try {
            if (discordUsername) {
              await verifyDiscordCloud({ discordUsername });
              await reloadUser();
            }
          } catch {}
        })();
      }
    }
    window.addEventListener('message', onMessage);
    return () => { window.removeEventListener('message', onMessage); };
  }, [reloadUser]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 560,
            borderRadius: 2,
            px: 3,
            py: 3,
            bgcolor: surfaceBg,
            border: `1px solid ${surfaceBorder}`,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <Stack spacing={3}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Your Profile
                </Typography>
                {!!discordUsername && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 18, width: 18 }} />
                    <Typography variant="body2" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700 }}>
                      Verified as {discordUsername}
                    </Typography>
                  </Stack>
                )}
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Update your username and avatar here.
              </Typography>
            </Box>
            

            {currentUser ? (
              <Stack direction="row" spacing={1.5} alignItems="center" >
                <Box
                  onClick={handleAvatarClick}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    p: 0.5,
                    border: `1px solid ${alpha(currentTheme.palette.light.main, 0.35)}`,
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                    '&:hover': { bgcolor: hoverBg, borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                    '&:hover .avatarOverlay': { opacity: 1 },
                  }}
                >
                  <Avatar src={avatarPreview} sx={{ width: 72, height: 72 }}>
                    {currentUser?.email?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box
                    className="avatarOverlay"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bottom: 4,
                      left: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.35)',
                      color: '#fff',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <FileUpload fontSize="medium" />
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </Box>
                  <TextField
                    fullWidth
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder={initialUsername ? undefined : 'Create your username!'}
                    label="Username"
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: currentTheme.palette.light.main,
                        '&.Mui-focused': { color: currentTheme.palette.light.main },
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.35) },
                        '&:hover fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                        '&.Mui-focused fieldset': { borderColor: currentTheme.palette.light.main },
                      },
                    }}
                  />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  You must log in first to edit your profile
                </Typography>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  color="inherit"
                  startIcon={<AccountCircle />}
                  sx={{
                    minWidth: 96,
                    px: 1.5,
                    height: 36,
                    textTransform: 'none',
                    borderColor: surfaceBorder,
                    bgcolor: alpha(currentTheme.palette.light.main, 0.04),
                    transition: 'transform 0.2s ease',
                    '&:hover': { bgcolor: hoverBg, borderColor: alpha(currentTheme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                  }}
                >
                  Log in
                </Button>
              </Stack>
            )}
          </Stack>

          {currentUser && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Logout />}
                onClick={logout}
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  height: 36,
                  textTransform: 'none',
                  borderColor: surfaceBorder,
                  bgcolor: alpha(currentTheme.palette.light.main, 0.04),
                  transition: 'transform 0.2s ease',
                  '&:hover': { bgcolor: hoverBg, borderColor: alpha(currentTheme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                }}
              >
                Log out
              </Button>
              <Button
                variant="outlined"
                color="brand"
                onClick={handleSave}
                disabled={!isDirty}
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  height: 36,
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
                    bgcolor: alpha(currentTheme.palette.light.main, 0.04),
                    borderColor: surfaceBorder,
                    color: currentTheme.palette.light.main,
                    transform: 'none',
                  },
                }}
              >
                Save
              </Button>
            </Box>
          )}
        </Paper>

        {currentUser && !discordUsername && (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 560,
              borderRadius: 2,
              px: 3,
              py: 3,
              bgcolor: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Verify with Discord
                </Typography>
                <VerifiedUser />
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                When you verify with Discord, a checkmark appears beside your name and your Discord username is displayed.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="brand"
                size="large"
                startIcon={<DiscordIcon />}
                sx={{
                  minWidth: 96,
                  px: 2,
                  height: 52,
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
                onClick={handleDiscordAuth}
              >
                Verify with Discord
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default AccountPage;


