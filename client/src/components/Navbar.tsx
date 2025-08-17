import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import Logo from './icons/logo';
import ShinyText from '../blocks/TextAnimations/ShinyText/ShinyText';

const HoverLogoLabel: React.FC = () => {
  const logoRef = React.useRef<{ retract: () => Promise<void> } | null>(null);
  const trigger = React.useCallback(() => {
    if (logoRef.current) void logoRef.current.retract();
  }, []);
  return (
    <Stack
      component="a"
      href="/"
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

const Navbar: React.FC = () => {
  const theme = useTheme();
  const surfaceBg = alpha(theme.palette.light.main, 0.06);
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);
  const hoverBg = alpha(theme.palette.light.main, 0.1);

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: theme.zIndex.appBar,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 999,
          px: 2,
          py: 1,
          bgcolor: surfaceBg,
          border: `1px solid ${surfaceBorder}`,
          position: 'relative',
          overflow: 'visible',
          backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.light.main, 0.08)} 0%, ${alpha(theme.palette.light.main, 0.03)} 100%)`,
          boxShadow: 'none',
          backdropFilter: 'saturate(140%) blur(8px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            boxShadow: `inset 0 1px 0 ${alpha(theme.palette.light.main, 0.18)}`,
            pointerEvents: 'none'
          }
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} justifyContent="space-between">
          <HoverLogoLabel />

          <Stack direction="row" alignItems="center" spacing={1}
            sx={{
              '& .MuiButton-root': { textTransform: 'none', borderRadius: 999 }
            }}
          >
            <Button
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
                background: `linear-gradient(180deg, ${alpha(theme.palette.dark.main, 0.42)} 0%, ${alpha(theme.palette.dark.main, 0.42)} 100%), linear-gradient(180deg, ${alpha(theme.palette.brand.main, 0.18)} 0%, ${alpha(theme.palette.brand.main, 0.12)} 100%)`,
                boxShadow: `inset 0 1px 0 ${alpha(theme.palette.light.main, 0.12)}, 0 4px 16px ${alpha(theme.palette.brand.main, 0.12)}`,
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none'
                },
                '& .shiny-text': {
                  letterSpacing: '0.01em',
                  fontWeight: 700
                },
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.light.main, 0.18)}, 0 8px 22px ${alpha(theme.palette.brand.main, 0.22)}`,
                  background: `linear-gradient(180deg, ${alpha(theme.palette.dark.main, 0.46)} 0%, ${alpha(theme.palette.dark.main, 0.46)} 100%), linear-gradient(180deg, ${alpha(theme.palette.brand.main, 0.24)} 0%, ${alpha(theme.palette.brand.main, 0.16)} 100%)`,
                  borderColor: alpha(theme.palette.brand.main, 0.6)
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.light.main, 0.1)}, 0 3px 10px ${alpha(theme.palette.brand.main, 0.16)}`,
                },
                '&:focus-visible': {
                  outline: 'none',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.brand.main, 0.25)}, inset 0 1px 0 ${alpha(theme.palette.light.main, 0.12)}`
                }
              }}
            >
              <ShinyText text="Sign up" disabled={false} speed={2.5} />
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Navbar;


