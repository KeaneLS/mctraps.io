import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  IconButton,
  Button
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format as formatDate } from 'date-fns';

export type TierLetter = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type MinigameOption = 'UHC' | 'SMP' | 'HCF' | 'Hoplite' | 'Skywars' | 'Walls' | 'Speed UHC';
export type TypeOption = 'Main' | 'Backup' | 'Hybrid';

export type FilterPayload = {
  dateInvented?: { from?: string; to?: string; direction?: 'asc' | 'desc' };
  tierlistRating?: { ratings: TierLetter[]; direction?: 'asc' | 'desc' };
  minigames?: MinigameOption[];
  types?: TypeOption[];
  search?: string;
};

type Props = {
  value?: FilterPayload;
  onChange: (payload: FilterPayload) => void;
  // Controls how much lighter the section cards are than the dark surface (for my testing)
  cardLightness?: number;
};

const allTierLetters: TierLetter[] = ['S','A','B','C','D','E','F'];
const allMinigames: MinigameOption[] = ['UHC','SMP','HCF','Hoplite','Skywars','Walls','Speed UHC'];
const allTypes: TypeOption[] = ['Main','Backup','Hybrid'];

const FilterPanel: React.FC<Props> = ({ value, onChange, cardLightness = 0.04 }) => {
  const theme = useTheme();
  const sectionAlpha = Math.max(0, Math.min(0.16, cardLightness));
  const borderAlpha = Math.min(sectionAlpha + 0.02, 0.18);
  const surfaceBg = alpha(theme.palette.light.main, sectionAlpha);
  const surfaceBorder = alpha(theme.palette.light.main, borderAlpha);
  const frameBg = alpha(theme.palette.dark.main, 0.4);
  const frameDivider = alpha(theme.palette.light.main, 0.06);
  const outerBorder = alpha(theme.palette.light.main, 0.12);
  const sectionMinHeight = 116;
  const sectionContentRowSx = { alignItems: 'center', minHeight: 44 } as const;

  const [fromDate, setFromDate] = React.useState<Date | null>(null);
  const [toDate, setToDate] = React.useState<Date | null>(null);
  const [dateDirection, setDateDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);

  const [tiers, setTiers] = React.useState<TierLetter[]>([]);
  const [tierDirection, setTierDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);

  const [minigames, setMinigames] = React.useState<MinigameOption[]>([]);
  const [types, setTypes] = React.useState<TypeOption[]>([]);

  const buildPayload = (): FilterPayload => {
    const payload: FilterPayload = {};
    if (fromDate || toDate || typeof dateDirection !== 'undefined') {
      payload.dateInvented = {
        from: fromDate ? formatDate(fromDate, 'yyyy-MM-dd') : undefined,
        to: toDate ? formatDate(toDate, 'yyyy-MM-dd') : undefined,
        direction: dateDirection,
      };
    }
    if (tiers.length > 0 || typeof tierDirection !== 'undefined') {
      payload.tierlistRating = { ratings: tiers, direction: tierDirection } as any;
    }
    if (minigames.length > 0) payload.minigames = minigames;
    if (types.length > 0) payload.types = types;
    if (value?.search) payload.search = value.search;
    return payload;
  };

  React.useEffect(() => {
    onChange(buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, dateDirection, tiers, tierDirection, minigames, types]);

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${outerBorder}`, borderRadius: 2, bgcolor: theme.palette.dark.main }}>
      <Box sx={{ pr: 2, pl: 2, pt: 1.5, pb: 1.5, borderBottom: `1px solid ${frameDivider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component="span" variant="h6" sx={{ fontWeight: 700 }}>Filters</Typography>
            <Typography component="span" variant="body2" sx={{ fontWeight: 400 }}>Click the search button to apply filters</Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => {
              setFromDate(null);
              setToDate(null);
              setDateDirection(undefined);
              setTiers([]);
              setTierDirection(undefined);
              setMinigames([]);
              setTypes([]);
            }}
            sx={{
              textTransform: 'none',
              minWidth: 0,
              px: 1,
              py: 0.25,
              height: 28,
              lineHeight: 1,
              borderRadius: 2,
              color: 'light.main',
              '&:hover': { bgcolor: alpha(theme.palette.light.main, 0.08) }
            }}
          >
            Reset
          </Button>
        </Stack>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box
          sx={{
            pt: 2,
            px: 2,
            pb: 2,
            bgcolor: theme.palette.dark.main,
            '& .MuiButton-root, & .MuiToggleButton-root': {
              textTransform: 'none'
            }
          }}
        >
          <Stack spacing={2.5}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderColor: surfaceBorder, bgcolor: surfaceBg, minHeight: sectionMinHeight }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Date Invented</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={sectionContentRowSx}>
                <DatePicker
                  label="From"
                  value={fromDate}
                  onChange={(val: Date | null) => setFromDate(val)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        minWidth: 320,
                        '& .MuiOutlinedInput-root': { height: 36 },
                        '& .MuiInputBase-input': { fontSize: 14, py: 0, height: '100%' },
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: 18, width: 18, height: 18 },
                        '& .MuiInputLabel-root': { fontSize: 14 },
                      }
                    },
                    openPickerButton: { sx: { ml: 1 } }
                  }}
                />
                <DatePicker
                  label="To"
                  value={toDate}
                  onChange={(val: Date | null) => setToDate(val)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        minWidth: 320,
                        '& .MuiOutlinedInput-root': { height: 36 },
                        '& .MuiInputBase-input': { fontSize: 14, py: 0, height: '100%' },
                        '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: 18, width: 18, height: 18 },
                        '& .MuiInputLabel-root': { fontSize: 14 },
                      }
                    },
                    openPickerButton: { sx: { ml: 1 } }
                  }}
                />
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton
                    color={dateDirection === 'asc' ? 'primary' : 'inherit'}
                    onClick={() => setDateDirection(dateDirection === 'asc' ? undefined : 'asc')}
                    aria-label="ascending"
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton
                    color={dateDirection === 'desc' ? 'primary' : 'inherit'}
                    onClick={() => setDateDirection(dateDirection === 'desc' ? undefined : 'desc')}
                    aria-label="descending"
                  >
                    <ArrowDownward />
                  </IconButton>
                  
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderColor: surfaceBorder, bgcolor: surfaceBg, minHeight: sectionMinHeight }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Tierlist Rating</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={sectionContentRowSx}>
                <ToggleButtonGroup
                  value={tiers}
                  onChange={(event: React.MouseEvent<HTMLElement>, val: TierLetter[]) => setTiers(val || [])}
                  aria-label="tiers"
                  size="small"
                  exclusive={false}
                >
                  {allTierLetters.map((t) => (
                    <ToggleButton
                      key={t}
                      value={t}
                      aria-label={t}
                      sx={{
                        width: 40,
                        height: 36,
                        p: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {t}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <IconButton
                    color={tierDirection === 'asc' ? 'primary' : 'inherit'}
                    onClick={() => setTierDirection(tierDirection === 'asc' ? undefined : 'asc')}
                    aria-label="ascending"
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton
                    color={tierDirection === 'desc' ? 'primary' : 'inherit'}
                    onClick={() => setTierDirection(tierDirection === 'desc' ? undefined : 'desc')}
                    aria-label="descending"
                  >
                    <ArrowDownward />
                  </IconButton>
                  
                </Stack>
              </Stack>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderColor: surfaceBorder, bgcolor: surfaceBg, minHeight: sectionMinHeight }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Minigame</Typography>
              <Stack direction="row" sx={sectionContentRowSx}>
                <ToggleButtonGroup
                  value={minigames}
                  onChange={(event: React.MouseEvent<HTMLElement>, val: MinigameOption[]) => setMinigames(val || [])}
                  aria-label="minigames"
                  size="small"
                  exclusive={false}
                >
                  {allMinigames.map((m) => (
                    <ToggleButton key={m} value={m} aria-label={m} sx={{ px: 1.5, py: 0.75 }}>
                      {m}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Paper>

            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderColor: surfaceBorder, bgcolor: surfaceBg, minHeight: sectionMinHeight }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Type</Typography>
              <Stack direction="row" sx={sectionContentRowSx}>
                <ToggleButtonGroup
                  value={types}
                  onChange={(event: React.MouseEvent<HTMLElement>, val: TypeOption[]) => setTypes(val || [])}
                  aria-label="types"
                  size="small"
                  exclusive={false}
                >
                  {allTypes.map((t) => (
                    <ToggleButton key={t} value={t} aria-label={t} sx={{ px: 1.5, py: 0.75 }}>
                      {t}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </LocalizationProvider>
    </Paper>
  );
};

export default FilterPanel;


