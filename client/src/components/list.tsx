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

type Trap = {
  id: string;
  name: string;
  creators: string[];
  thumbnailPath: string;
};

const normalizeThumbnailPath = (path: string): string => {
  // The backend dummy data includes "/public" in the path; CRA serves public files from root
  // so we strip the leading "/public" if present.
  if (path.startsWith('/public/')) return path.replace('/public', '');
  return path;
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
        const res = await fetch('/api/traps');
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = (await res.json()) as Trap[];
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
        borderRadius: 4,
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
          borderRadius: 4,
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
  const hoverBg = alpha(theme.palette.light.main, 0.08);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: surfaceBg,
        border: `1px solid ${surfaceBorder}`,
        borderRadius: 4,
        p: 1.25,
        transition: 'background-color 120ms ease, transform 120ms ease, border-color 120ms ease',
        '&:hover': {
          bgcolor: hoverBg,
          borderColor: alpha(theme.palette.light.main, 0.18),
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          component="img"
          src={normalizeThumbnailPath(trap.thumbnailPath)}
          alt={trap.name}
          sx={{
            width: 220,
            height: 120,
            objectFit: 'cover',
            borderRadius: 4,
            display: 'block',
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
            {trap.name}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }} noWrap>
            {trap.creators.join(', ')}
          </Typography>
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


