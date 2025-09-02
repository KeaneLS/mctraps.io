import React from 'react';
import { Box, Paper, IconButton, ThemeProvider, CssBaseline, Stack, Typography, Divider } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import Login from '../pages/login';
import { darkTheme } from '../theme';
import ShinyText from '../blocks/TextAnimations/ShinyText/ShinyText';

export interface PopupProps {
  open: boolean;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ open, onClose }) => {
  const outerTheme = useTheme();
  const hasCustomPalette = !!(outerTheme as any)?.palette?.dark?.main;
  const isDarkMode = outerTheme.palette.mode === 'dark';

  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const [loopDistance, setLoopDistance] = React.useState<number>(0);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (groupRef.current) {
        setLoopDistance(groupRef.current.offsetWidth + 20);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (groupRef.current) ro.observe(groupRef.current);
    if (viewportRef.current) ro.observe(viewportRef.current);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [open]);

  const body = (
    <Box
      role="dialog"
      aria-modal="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: `${open ? 'popupFadeIn 260ms ease forwards' : 'popupFadeOut 220ms ease forwards'}`,
        '@keyframes popupFadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        '@keyframes popupFadeOut': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      }}
    >
      <Box sx={{ transform: 'scale(1)', transformOrigin: 'center', display: 'inline-block' }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 760,
            borderRadius: 3,
            border: (theme) => `1px solid ${alpha(theme.palette.light.main, 0.12)}`,
            bgcolor: (theme) => theme.palette.dark?.main ?? '#111',
            p: { xs: 2.5, sm: 3 },
            boxShadow: (theme) => `0 10px 40px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)'}`,
          }}
        >
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          color="inherit"
        >
          <CloseIcon />
        </IconButton>
        <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center', mt: 3, mb: 3 }}>
          <Stack spacing={1.25} alignItems="center">
          <Typography
            variant="h3"
            sx={(theme) => ({
              fontWeight: 700,
              color: theme.palette.light.main,
              letterSpacing: '-0.01em',
            })}
          >
            It's more fun with an account
          </Typography>
          <Typography
            variant="body1"
            sx={(theme) => ({
              maxWidth: 700,
              color: alpha(theme.palette.light.main, 0.9),
            })}
          >
            Upload traps, rate others, join the conversation.
          </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={(theme) => ({
              fontWeight: 520,
              color: alpha(theme.palette.light.main, 0.3),
            })}
          >
            {isDarkMode ? (
              <ShinyText text="Trusted by your favorite trappers" />
            ) : (
              'Trusted by your favorite trappers'
            )}
          </Typography>
          <Box
            sx={{
              width: '100%',
              overflow: 'hidden',
              py: 0,
              position: 'relative',
              '@keyframes logoScroll': {
                '0%': { transform: 'translate3d(0,0,0)' },
                '100%': { transform: 'translate3d(var(--logo-loop-distance, -50%),0,0)' },
              },
            }}
            ref={viewportRef}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: 'max-content',
                animation: 'logoScroll 28s linear infinite',
                willChange: 'transform',
                gap: '20px',
              }}
              style={{ ['--logo-loop-distance' as any]: loopDistance ? `-${loopDistance}px` : undefined }}
            >
              {[0,1].map((group) => (
                <Box key={group} ref={group === 0 ? groupRef : undefined} sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {[1,2,3,4,5,6,7].map((n, idx) => (
                    <Box
                      key={`${group}-${n}`}
                      sx={{
                        width: 95,
                        height: 95,
                        borderRadius: 16,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.04)'
                      }}
                    >
                      <Box
                        component="img"
                        src={`/yt_logos/${n}.jpg`}
                        alt={`logo-${n}`}
                        draggable={false}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <Box
              sx={(theme) => ({
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 48,
                background: `linear-gradient(90deg, ${theme.palette.dark.main} 0%, ${alpha(theme.palette.dark.main, 0)} 100%)`,
              })}
            />
            <Box
              sx={(theme) => ({
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: 48,
                background: `linear-gradient(270deg, ${theme.palette.dark.main} 0%, ${alpha(theme.palette.dark.main, 0)} 100%)`,
              })}
            />
          </Box>

          <Divider sx={{ width: '100%', opacity: 0.12, my: 3, mx: 0 }} />

          <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto', mt: 0 }}>
            <Login isSignup embedded />
          </Box>
        </Stack>
        </Paper>
      </Box>
    </Box>
  );

  if (!open) return null;
  return body;
};

export default Popup;


