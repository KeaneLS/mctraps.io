import React from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Navbar from '../components/Navbar';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import { useAuth } from '../firebase/authContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { submitTrapForReview } from '../firebase/dataAccess';

type MinigameOption = 'UHC' | 'SMP' | 'HCF' | 'Hoplite' | 'Skywars' | 'Walls' | 'Speed UHC';
type TypeOption = 'Main' | 'Backup' | 'Hybrid';

const allMinigames: MinigameOption[] = ['UHC','SMP','HCF','Hoplite','Skywars','Walls','Speed UHC'];
const allTypes: TypeOption[] = ['Main','Backup','Hybrid'];

const UploadTrap: React.FC = () => {
  const navigate = useNavigate();
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

  const { currentUser } = useAuth();

  const surfaceBg = alpha(currentTheme.palette.light.main, 0.06);
  const surfaceBorder = alpha(currentTheme.palette.light.main, 0.12);
  const hoverBg = alpha(currentTheme.palette.light.main, 0.1);

  const [trapName, setTrapName] = React.useState<string>('');
  const [creators, setCreators] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [minigames, setMinigames] = React.useState<MinigameOption[]>([]);
  const [types, setTypes] = React.useState<TypeOption[]>([]);
  const [inventedDate, setInventedDate] = React.useState<Date | null>(null);
  const [youtubeUrl, setYoutubeUrl] = React.useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | undefined>(undefined);
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const sectionAlpha = Math.max(0, Math.min(0.16, 0.04));
  const borderAlpha = Math.min(sectionAlpha + 0.02, 0.18);
  const surfaceBgInner = currentTheme.palette.dark.main;
  const surfaceBorderInner = alpha(currentTheme.palette.light.main, borderAlpha);
  const frameBg = currentTheme.palette.mode === 'light' ? '#ECECED' : '#262628';
  const frameDivider = alpha(currentTheme.palette.light.main, 0.06);
  const outerBorder = alpha(currentTheme.palette.light.main, 0.12);
  const sectionMinHeight = 116;

  const cardBaseSx = {
    p: 2,
    borderColor: surfaceBorderInner,
    bgcolor: surfaceBgInner,
    minHeight: sectionMinHeight,
    borderRadius: 2,
    boxShadow: '0 2px 8px rgba(0,0,0,0.22)'
  } as const;

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFilesSelected(files?: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  }

  function onDropHandler(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    onFilesSelected(e.dataTransfer?.files);
  }

  function onDragOverHandler(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function parseYouTube(url: string): { id: string } | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.replace(/^\//, '');
        return id ? { id } : null;
      }
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v') || '';
        return id ? { id } : null;
      }
      return null;
    } catch { return null; }
  }

  function listMissingFields(): string[] {
    const missing: string[] = [];
    if (!trapName.trim()) missing.push('Trap Name');
    if (!creators.split(',').map((s)=>s.trim()).filter(Boolean).length) missing.push('Creators');
    if (!minigames.length) missing.push('Minigame');
    if (!types.length) missing.push('Trap Type');
    if (!inventedDate) missing.push('Date Invented');
    if (!youtubeUrl.trim()) missing.push('YouTube Tutorial Link');
    else if (!parseYouTube(youtubeUrl)) missing.push('Valid YouTube Link');
    return missing;
  }

  async function onPublish() {
    if (isSubmitting) return;
    setError(null);
    const missing = listMissingFields();
    if (missing.length) {
      setError(`Please fill out: ${missing.join(', ')}.`);
      return;
    }
    try {
      setIsSubmitting(true);
      const created = inventedDate ? inventedDate : new Date();
      const yyyy = created.getFullYear();
      const mm = String(created.getMonth() + 1).padStart(2, '0');
      const dd = String(created.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const id = await submitTrapForReview({
        name: trapName.trim(),
        creators: creators.split(',').map((s) => s.trim()).filter(Boolean),
        minigame: minigames,
        type: types,
        dateInvented: dateStr,
        youtubeUrl: youtubeUrl.trim(),
        description,
        thumbnailFile,
      });
      try { console.log('Submitted trap for review:', id); } catch {}
      setError(null);
      setTrapName(''); setCreators(''); setDescription(''); setMinigames([]); setTypes([]); setInventedDate(null); setYoutubeUrl(''); setThumbnailFile(null); setThumbnailPreview(undefined);
      try {
        const msg = 'Your trap has been successfully uploaded and is now pending review by our staff. You will receive an email with the status update once it has been accepted or denied. (Be sure to check your junk or spam folder!)';
        window.localStorage.setItem('globalToast', msg);
      } catch {}
      navigate('/home');
    } catch (e: any) {
      const msg = e?.message || 'Submission failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />

      <Box sx={{ mt: -1.15, maxWidth: 1040, mx: 'auto', px: 2, pb: 6 }}>
        {!currentUser ? (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 560,
              mx: 'auto',
              borderRadius: 2,
              px: 3,
              py: 3,
              bgcolor: surfaceBg,
              border: `1px solid ${surfaceBorder}`,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                You must log in first to upload a trap
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="inherit"
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
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: 2,
              bgcolor: frameBg,
              border: `1px solid ${outerBorder}`,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <Stack spacing={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 2, pl: 2, pt: 1.5, pb: 1.5, borderBottom: `1px solid ${frameDivider}` }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    Upload Trap
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Fill in the details below, then publish your trap.
                  </Typography>
                </Box>
              </Box>

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{
                  pt: 2,
                  px: 2,
                  pb: 2,
                  bgcolor: frameBg,
                  '& .MuiButton-root, & .MuiToggleButton-root': {
                    textTransform: 'none'
                  }
                }}>
                  <Stack spacing={2.5}>
                    <Paper elevation={0} variant="outlined" sx={cardBaseSx} >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Trap Name</Typography>
                      <TextField
                        fullWidth
                        value={trapName}
                        inputProps={{ maxLength: 120 }}
                        onChange={(e) => setTrapName(e.target.value)}
                        placeholder="Enter a concise, descriptive name"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.35) },
                            '&:hover fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                            '&.Mui-focused fieldset': { borderColor: currentTheme.palette.light.main },
                          },
                        }}
                      />
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Creators</Typography>
                      <TextField
                        fullWidth
                        value={creators}
                        inputProps={{ maxLength: 300 }}
                        onChange={(e) => setCreators(e.target.value)}
                        placeholder="Comma separate multiple creators (e.g., user1, user2)"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.35) },
                            '&:hover fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                            '&.Mui-focused fieldset': { borderColor: currentTheme.palette.light.main },
                          },
                        }}
                      />
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Minigame</Typography>
                      <Stack direction="row" sx={{ alignItems: 'center', minHeight: 44 }}>
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

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Trap Type</Typography>
                      <Stack direction="row" sx={{ alignItems: 'center', minHeight: 44 }}>
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

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Date Invented</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center', minHeight: 44 }}>
                        <DatePicker
                          label="Date Invented"
                          value={inventedDate}
                          onChange={(val: Date | null) => setInventedDate(val)}
                          disableFuture
                          slotProps={{
                            textField: {
                              size: 'small',
                              inputProps: { maxLength: 10 },
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
                      </Stack>
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>YouTube Tutorial Link</Typography>
                      <TextField
                        fullWidth
                        value={youtubeUrl}
                        inputProps={{ maxLength: 2048 }}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.35) },
                            '&:hover fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                            '&.Mui-focused fieldset': { borderColor: currentTheme.palette.light.main },
                          },
                        }}
                      />
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={cardBaseSx}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Description</Typography>
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        value={description}
                        inputProps={{ maxLength: 2000 }}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe how the trap works, tips, and variations"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.35) },
                            '&:hover fieldset': { borderColor: alpha(currentTheme.palette.light.main, 0.55) },
                            '&.Mui-focused fieldset': { borderColor: currentTheme.palette.light.main },
                          },
                        }}
                      />
                    </Paper>

                    <Paper elevation={0} variant="outlined" sx={{ ...cardBaseSx, minHeight: undefined }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Trap Thumbnail</Typography>
                      <Box
                        onClick={openFilePicker}
                        onDrop={onDropHandler}
                        onDragOver={onDragOverHandler}
                        sx={{
                          cursor: 'pointer',
                          border: `1px dashed ${alpha(currentTheme.palette.light.main, 0.35)}`,
                          borderRadius: 2,
                          p: 2,
                          minHeight: 160,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          bgcolor: alpha(currentTheme.palette.light.main, 0.02),
                          transition: 'border-color 0.2s ease, background-color 0.2s ease',
                          '&:hover': { borderColor: alpha(currentTheme.palette.light.main, 0.55), bgcolor: alpha(currentTheme.palette.light.main, 0.04) }
                        }}
                      >
                        {thumbnailPreview ? (
                          <Box sx={{ position: 'relative', width: '100%', maxWidth: 560 }}>
                            <img src={thumbnailPreview} alt="Trap thumbnail preview" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Drag and drop an image here, or click to select
                          </Typography>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => onFilesSelected(e.target.files)}
                        />
                      </Box>
                    </Paper>

                    {error && (
                      <Typography variant="body2" sx={{ mt: 1, mb: 1, color: (theme) => theme.palette.light.main }}>
                        {error}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                      <Button
                        variant="outlined"
                        color="brand"
                        onClick={onPublish}
                        disabled={isSubmitting}
                        sx={{
                          minWidth: 120,
                          px: 2,
                          height: 40,
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
                      >
                        {isSubmitting ? 'Publishing…' : 'Publish Trap'}
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </LocalizationProvider>
            </Stack>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default UploadTrap;


