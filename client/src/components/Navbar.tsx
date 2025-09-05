import React from 'react';
import { Box, Button, Paper, Stack, Typography, IconButton, Avatar, Snackbar, Alert, Grow } from '@mui/material';
import { AccountCircle, DarkMode, LightMode, Logout, BlurOn, BlurOff, RateReview, Upload } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import Logo from './icons/logo';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth, AppUser } from '../firebase/authContext';
 

const HoverLogoLabel: React.FC = () => {
  const logoRef = React.useRef<{ retract: () => Promise<void> } | null>(null);
  const trigger = React.useCallback(() => {
    if (logoRef.current) void logoRef.current.retract();
  }, []);
  return (
    <Stack
      component={RouterLink}
      to="/home"
      direction="row"
      alignItems="center"
      spacing={0.6}
      onMouseEnter={trigger}
      sx={{ userSelect: 'none', cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
    >
      <Logo ref={logoRef} width={28} height={28} retractOffset={8} aria-label="MCTraps" />
      <Typography
        variant="h6"
        onMouseEnter={trigger}
        sx={{ fontWeight: 700, letterSpacing: '0.01em', ml: -0.5 }}
      >
        MCTraps
      </Typography>
    </Stack>
  );
};

export interface NavbarProps {
  mode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ mode = 'light', onToggleTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const surfaceBg = alpha(theme.palette.light.main, 0.06);
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);
  const hoverBg = alpha(theme.palette.light.main, 0.1);
  const { currentUser, loading, logout } = useAuth();
  const appUser = currentUser as AppUser | null;

  const [adminCached, setAdminCached] = React.useState<boolean>(() => {
    try {
      return window.localStorage.getItem('isAdmin') === 'true';
    } catch {}
    return false;
  });

  React.useEffect(() => {
    try {
      const isAdmin = appUser?.admin === true;
      window.localStorage.setItem('isAdmin', String(isAdmin));
      setAdminCached(isAdmin);
    } catch {}
  }, [appUser?.admin]);

  const [particlesEnabled, setParticlesEnabled] = React.useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('particlesEnabled');
      return stored === null ? true : stored === 'true';
    } catch {}
    return true;
  });

  const toggleParticles = React.useCallback(() => {
    setParticlesEnabled((prev) => {
      const next = !prev;
      try { window.localStorage.setItem('particlesEnabled', String(next)); } catch {}
      try {
        (window as any).__COALESCE_USER_ENABLED__ = next;
        (window as any).__COALESCE_REQUESTED__ = next;
        if (next) {
          if (typeof (window as any).__COALESCE_SETUP__ === 'function') (window as any).__COALESCE_SETUP__();
          if (typeof (window as any).__COALESCE_SET_VISIBLE__ === 'function') (window as any).__COALESCE_SET_VISIBLE__(true);
        } else {
          if (typeof (window as any).__COALESCE_SET_VISIBLE__ === 'function') (window as any).__COALESCE_SET_VISIBLE__(false);
          if (typeof (window as any).__COALESCE_DESTROY__ === 'function') (window as any).__COALESCE_DESTROY__();
        }
        const evt = new Event('COALESCE_ENABLED_CHANGED');
        window.dispatchEvent(evt);
      } catch {}
      return next;
    });
  }, []);

  const [showUploadWarning, setShowUploadWarning] = React.useState(false);
  const [globalToast, setGlobalToast] = React.useState<string | null>(null);
  const [globalToastOpen, setGlobalToastOpen] = React.useState<boolean>(false);
  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setShowUploadWarning(false);
  };

  React.useEffect(() => {
    let msg: string | null = null;
    try { msg = window.localStorage.getItem('globalToast'); } catch {}
    if (msg) {
      setGlobalToast(msg);
      setGlobalToastOpen(true);
      try { window.localStorage.removeItem('globalToast'); } catch {}
    }
  }, []);

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 16,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: 'flex',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 9,
          px: 2,
          py: 1,
          bgcolor: surfaceBg,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${surfaceBorder}`,
          position: 'relative',
          overflow: 'visible',
          boxShadow: 'none',
          pointerEvents: 'auto'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
          <HoverLogoLabel />

          <Stack direction="row" alignItems="center" spacing={1}
            sx={{
              '& .MuiButton-root': { textTransform: 'none', borderRadius: 9 }
            }}
          >
            {currentUser ? (
              null
            ) : (
              <>
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
                    borderColor: surfaceBorder,
                    bgcolor: alpha(theme.palette.light.main, 0.04),
                    transition: 'transform 0.2s ease',
                    '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                  }}
                >
                  Log in
                </Button>
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="outlined"
                  color="brand"
                  sx={{
                    minWidth: 96,
                    px: 1.5,
                    height: 36,
                    color: 'dark.main',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `1px solid ${alpha(theme.palette.brand.main, 0.45)}`,
                    bgcolor: theme.palette.brand.main,
                    boxShadow: 'none',
                    transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      borderColor: alpha(theme.palette.brand.main, 0.6)
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(theme.palette.brand.main, 0.6)}`,
                      outlineOffset: '2px'
                    }
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
            <IconButton
              color="inherit"
              onClick={onToggleTheme}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0,
                border: `1px solid ${surfaceBorder}`,
                bgcolor: alpha(theme.palette.light.main, 0.04),
                transition: 'transform 0.2s ease',
                '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
              }}
              aria-label="Toggle theme"
            >
              {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={toggleParticles}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 0,
                border: `1px solid ${surfaceBorder}`,
                bgcolor: alpha(theme.palette.light.main, 0.04),
                transition: 'transform 0.2s ease, background-color 0.2s ease',
                '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
              }}
              aria-label="Toggle particles"
            >
              {particlesEnabled ? <BlurOn fontSize="small" /> : <BlurOff fontSize="small" />}
            </IconButton>
            {(appUser?.admin || (loading && adminCached)) && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/review-traps"
                variant="outlined"
                startIcon={
                  <RateReview sx={{ mt: 0.25, width: 20, height: 20 }} />
                }
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  height: 36,
                  borderColor: surfaceBorder,
                  bgcolor: alpha(theme.palette.light.main, 0.04),
                  transition: 'transform 0.2s ease',
                  '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                }}
              >
                Review Traps
              </Button>
            )}
            {currentUser && (
              <Button
                color="inherit"
                variant="outlined"
                onClick={(e) => {
                  if (appUser && !appUser.displayName) {
                    e.preventDefault();
                    setShowUploadWarning(true);
                  } else {
                    navigate('/upload-trap');
                  }
                }}
                startIcon={
                  <Upload sx={{ width: 20, height: 20, transform: 'translateX(0.7px) translateY(-0.3px)' }} />
                }
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  height: 36,
                  borderColor: surfaceBorder,
                  bgcolor: alpha(theme.palette.light.main, 0.04),
                  transition: 'transform 0.2s ease',
                  '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                }}
              >
                Upload Trap
              </Button>
            )}
            {currentUser && (
              <Button
                color="inherit"
                component={RouterLink}
                to="/profile"
                variant="outlined"
                startIcon={
                  <Avatar src={currentUser.photoURL ?? undefined} sx={{ width: 20, height: 20 }}>
                    {currentUser.email?.[0]?.toUpperCase()}
                  </Avatar>
                }
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  height: 36,
                  borderColor: surfaceBorder,
                  bgcolor: alpha(theme.palette.light.main, 0.04),
                  transition: 'transform 0.2s ease',
                  '&:hover': { bgcolor: hoverBg, borderColor: alpha(theme.palette.light.main, 0.2), transform: 'translateY(-1px)' }
                }}
              >
                Profile
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={showUploadWarning}
        autoHideDuration={10000}
        onClose={handleSnackbarClose}
        sx={{ pointerEvents: 'auto' }}
        TransitionComponent={Grow}
      >
        <Alert
          severity="info"
          icon={false}
          onClick={() => setShowUploadWarning(false)}
          sx={{
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${surfaceBorder}`,
            color: 'text.primary',
            display: 'inline-flex'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'nowrap' }}>
            <Box
              component="span"
              onClick={(e: any) => { e.stopPropagation(); navigate('/profile'); }}
              sx={{ color: theme.palette.brand.main, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}
            >
              Create a username
            </Box>
            {` to upload traps`}
          </Typography>
        </Alert>
      </Snackbar>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={globalToastOpen}
        autoHideDuration={20000}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return;
          setGlobalToastOpen(false);
        }}
        sx={{ pointerEvents: 'auto' }}
        TransitionComponent={Grow}
        TransitionProps={{ onExited: () => { setGlobalToast(null); } }}
      >
        <Alert
          severity="info"
          icon={false}
          onClick={() => setGlobalToastOpen(false)}
          sx={{
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${surfaceBorder}`,
            color: 'text.primary',
            display: 'inline-flex',
            maxWidth: 560,
            width: '100%'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'normal' }}>
            {globalToast}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Navbar;


