import React from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  InputBase,
  Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Search, ExpandMore } from '@mui/icons-material';
import { S as TierS, A as TierA, B as TierB, C as TierC, D as TierD, E as TierE, F as TierF } from '../tiers';
import { readTraps } from '../firebase/dataAccess';

type Trap = {
  id: string;
  name: string;
  creators: string[];
  thumbnailPath?: string;
  thumbnailId?: string;
  rating?: { average: number; count: number };
  tierlistRating?: { average: number; count: number };
};

const useFetchTraps = () => {
  const [traps, setTraps] = React.useState<Trap[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = (await readTraps()) as unknown as Trap[];
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

const SearchBar: React.FC = () => {
  const theme = useTheme();
  const surfaceBg = alpha(theme.palette.light.main, 0.06);
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        bgcolor: surfaceBg,
        border: `1px solid ${surfaceBorder}`,
      }}
    >
      <Button
        variant="text"
        color="inherit"
        endIcon={<ExpandMore />}
        sx={{
          textTransform: 'none',
          px: 1.25,
          minWidth: 0,
          color: 'text.primary',
          borderRadius: 2,
          '&:hover': { bgcolor: alpha(theme.palette.light.main, 0.06) }
        }}
      >
        All
      </Button>
      <Divider orientation="vertical" flexItem sx={{ borderColor: surfaceBorder }} />
      <InputBase
        placeholder="Search..."
        inputProps={{ 'aria-label': 'search traps' }}
        sx={{ flex: 1, px: 1.25, py: 0.75 }}
      />
      <IconButton size="small" color="inherit" sx={{ color: 'text.primary' }} aria-label="search">
        <Search />
      </IconButton>
    </Paper>
  );
};

const TrapRow: React.FC<{ trap: Trap }> = ({ trap }) => {
  const theme = useTheme();
  const surfaceBg = alpha(theme.palette.light.main, 0.06);
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);
  const hoverBg = alpha(theme.palette.light.main, 0.12);

  const avg = trap.rating?.average ?? trap.tierlistRating?.average ?? 0;
  const cnt = trap.rating?.count ?? trap.tierlistRating?.count ?? undefined;
  const rounded = Math.max(0, Math.min(6, Math.round(avg)));
  const Tier = (
    rounded === 6 ? TierS :
    rounded === 5 ? TierA :
    rounded === 4 ? TierB :
    rounded === 3 ? TierC :
    rounded === 2 ? TierD :
    rounded === 1 ? TierE :
    TierF
  );
  const thumbnailSrc = trap.thumbnailPath || trap.thumbnailId || '';

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: surfaceBg,
        border: `1px solid ${surfaceBorder}`,
        borderRadius: 2,
        p: 1.25,
        position: 'relative',
        transition: 'background-color 120ms ease, transform 150ms ease, border-color 120ms ease',
        '&:hover': {
          bgcolor: hoverBg,
          borderColor: alpha(theme.palette.light.main, 0.18),
          transform: 'scale(1.02)',
          zIndex: 1,
        },
      }}
    >
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
            <Tier size={28}/>
            <Typography variant="body2" sx={{ opacity: 0.5, fontWeight: 500 }} noWrap>
                {cnt ?? 0} rankings
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

const TrapList: React.FC = () => {
  const theme = useTheme();
  const { traps, loading, error } = useFetchTraps();

  return (
    <Box sx={{
      maxWidth: 1040,
      mx: 'auto',
      px: 2,
      pb: 6,
    }}>
      <Stack spacing={2}>
        <Box sx={{ mt: 2 }}>
          <SearchBar />
        </Box>

        {loading && (
          <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
            Loading traps...
          </Typography>
        )}
        {error && (
          <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
            Failed to load traps: {error}
          </Typography>
        )}

        {!loading && !error && traps.map((trap) => (
          <TrapRow key={trap.id} trap={trap} />
        ))}
      </Stack>
    </Box>
  );
};

export default TrapList;


