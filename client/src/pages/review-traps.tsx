import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { S as TierS, A as TierA, B as TierB, C as TierC, D as TierD, E as TierE, F as TierF } from '../tiers';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import Navbar from '../components/Navbar';
import { useAuth } from '../firebase/authContext';
import { readTrapsInReview } from '../firebase/dataAccess';

type Trap = {
  id: string;
  name: string;
  creators: string[];
  dateInvented: string;
  type: string,
  thumbnailUrl?: string;
  minigame: string,
  rating?: { average: number; count: number };
  tierlistRating?: { average: number; count: number };
  commentCount?: number;
};

const useFetchTrapsInReview = () => {
  const [traps, setTraps] = React.useState<Trap[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = (await readTrapsInReview()) as unknown as Trap[];
        if (!cancelled) setTraps(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return { traps, loading, error };
};

const TrapRow: React.FC<{ trap: Trap }> = ({ trap }) => {
  const theme = useTheme();
  const surfaceBg = theme.palette.mode === 'light' ? '#ECECED' : '#262628';
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);
  const hoverBg = theme.palette.mode === 'light' ? '#DEDEDE' : '#333335';
  const navigate = useNavigate();

  const avg = trap.tierlistRating?.average ?? trap.rating?.average ?? null;
  const cnt = trap.tierlistRating?.count ?? trap.rating?.count ?? 0;
  const rounded = Math.max(0, Math.min(6, Math.round(avg || 0)));
  const Tier = (
    rounded === 6 ? TierS :
    rounded === 5 ? TierA :
    rounded === 4 ? TierB :
    rounded === 3 ? TierC :
    rounded === 2 ? TierD :
    rounded === 1 ? TierE :
    TierF
  );
  const thumbnailSrc = trap.thumbnailUrl || '';
  const invented = (() => {
    const d = new Date(trap.dateInvented);
    return isNaN(d.getTime()) ? trap.dateInvented : d.toLocaleDateString();
  })();
  const metaMinigame = trap.minigame;
  const metaType = trap.type;

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: surfaceBg,
        border: `1px solid ${surfaceBorder}`,
        borderRadius: 2,
        p: 1.25,
        position: 'relative',
        transition: 'background-color 0ms linear, transform 150ms ease, border-color 120ms ease',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: hoverBg,
          borderColor: alpha(theme.palette.light.main, 0.18),
          transform: 'scale(1.02)',
          zIndex: 1,
        },
      }}
      onClick={(e) => {
        e.preventDefault();
        navigate(`/trap/${trap.id}`);
      }}
    >
      <Typography
        variant="caption"
        sx={{ position: 'absolute', top: 8, right: 12, opacity: 0.7, fontWeight: 600 }}
      >
        {invented}
      </Typography>
      {(metaMinigame || metaType) && (
        <Stack
          spacing={0}
          sx={{ position: 'absolute', bottom: 8, right: 12, alignItems: 'flex-end' }}
        >
          {metaMinigame && (
            <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600 }}>
              {metaMinigame}
            </Typography>
          )}
          {metaType && (
            <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600 }}>
              {metaType}
            </Typography>
          )}
        </Stack>
      )}
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          component="img"
          src={thumbnailSrc}
          alt={trap.name}
          sx={{
            width: 220,
            height: 120,
            objectFit: 'cover',
            borderRadius: 2,
            display: 'block',
          }}
        />
        <Box sx={{ minWidth: 0, flex: 1  }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }} noWrap>
            {trap.name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.7, fontWeight: 500 }} noWrap>
            {trap.creators.join(', ')}
          </Typography>
          <Box mt={0.9} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {cnt > 0 && <Tier size={28} />}
            <Typography variant="body2" sx={{ opacity: 0.5, fontWeight: 500 }} noWrap>
              {cnt > 0 ? `${cnt} ratings` : 'No ratings'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

const ReviewTraps: React.FC = () => {
  const { currentUser, loading } = useAuth();
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

  const theme = currentTheme;
  const { traps: fetchedTraps, loading: trapsLoading, error } = useFetchTrapsInReview();

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />
      {!loading && (!currentUser || !currentUser.admin) && (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}>
          <Typography variant="body1">Admins only.</Typography>
        </Box>
      )}
      {currentUser?.admin && (
        <Box sx={{
          maxWidth: 1040,
          mx: 'auto',
          px: 2,
          pb: 6,
          position: 'relative',
        }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 17,
              right: 17,
              bottom: 0,
              bgcolor: theme.palette.background.default,
              borderRadius: 2,
              zIndex: -1,
            }}
          />
          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1, mt: -1.15 }}>

            {trapsLoading && (
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                Loading traps in review...
              </Typography>
            )}
            {error && (
              <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                Failed to load traps: {error}
              </Typography>
            )}

            {!trapsLoading && !error && fetchedTraps.map((trap) => (
              <TrapRow key={trap.id} trap={trap} />
            ))}

            {!trapsLoading && !error && fetchedTraps.length === 0 && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                No traps in review.
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </ThemeProvider>
  );
};

export default ReviewTraps;