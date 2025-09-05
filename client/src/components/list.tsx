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
import { Search, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { S as TierS, A as TierA, B as TierB, C as TierC, D as TierD, E as TierE, F as TierF } from '../tiers';
import { readTraps, searchTraps as searchTrapsApi } from '../firebase/dataAccess';
import FilterPanel, { FilterPayload } from './FilterPanel';

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

const SearchBar: React.FC<{
	onToggleFilter: () => void;
	isFilterActive: boolean;
	onSearch: (text: string) => void;
}> = ({ onToggleFilter, isFilterActive, onSearch }) => {
  const theme = useTheme();
  const surfaceBg = theme.palette.mode === 'light' ? '#ECECED' : '#262628';
  const surfaceBorder = alpha(theme.palette.light.main, 0.12);
  const [text, setText] = React.useState<string>('');

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
        transition: 'background-color 0ms linear, border-color 120ms ease',
      }}
    >
      <Button
        variant="text"
        color="inherit"
        onClick={onToggleFilter}
        sx={{
          textTransform: 'none',
          px: 1.25,
          minWidth: 0,
          borderRadius: 2,
          bgcolor: isFilterActive ? 'brand.main' : 'transparent',
          color: isFilterActive ? 'dark.main' : 'text.primary',
          '&:hover': { bgcolor: isFilterActive ? alpha(theme.palette.brand.main, 0.9) : alpha(theme.palette.light.main, 0.06) }
        }}
      >
        Filter
      </Button>
      <Divider orientation="vertical" flexItem sx={{ borderColor: surfaceBorder }} />
      <InputBase
        placeholder="Search..."
        inputProps={{ 'aria-label': 'search traps', maxLength: 100 }}
        sx={{ flex: 1, px: 1.25, py: 0.75 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch(text.trim());
        }}
      />
      <IconButton
        size="small"
        aria-label="search"
        onClick={() => onSearch(text.trim())}
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'brand.main',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          '&:hover': { bgcolor: alpha(theme.palette.brand.main, 0.9) }
        }}
      >
        <Search sx={{ color: theme.palette.dark.main }} />
      </IconButton>
    </Paper>
  );
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

const TrapList: React.FC = () => {
  const theme = useTheme();
  const { traps: fetchedTraps, loading, error } = useFetchTraps();
  const [filteredTraps, setFilteredTraps] = React.useState<Trap[]>([]);
  const [filterOpen, setFilterOpen] = React.useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = React.useState<FilterPayload | null>(null);
  const [searchText, setSearchText] = React.useState<string>('');

  React.useEffect(() => {
    setFilteredTraps(fetchedTraps);
  }, [fetchedTraps]);

  const handleOpenFilter = () => {
    setFilterOpen((v) => {
      const next = !v;
      if (!next) setCurrentFilter(null);
      return next;
    });
  };

  const handleApplyFilter = (payload: FilterPayload) => {
    setCurrentFilter(payload);
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    const payload: FilterPayload = {
      ...(filterOpen ? (currentFilter ?? {}) : {}),
      search: text || undefined,
    };
    console.log('Search payload:', payload);
    try {
      const serverResults = await searchTrapsApi(payload as any);
      setFilteredTraps(serverResults as unknown as Trap[]);
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  return (
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
      <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ mt: 2 }}>
          <SearchBar
            onToggleFilter={handleOpenFilter}
            isFilterActive={filterOpen}
            onSearch={handleSearch}
          />
          {filterOpen && (
            <Box mt={2}>
              <FilterPanel value={currentFilter ?? {}} onChange={handleApplyFilter} />
            </Box>
          )}
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

        {!loading && !error && filteredTraps.map((trap) => (
          <TrapRow key={trap.id} trap={trap} />
        ))}

        {!loading && !error && filteredTraps.length === 0 && (
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            No traps match your query.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default TrapList;