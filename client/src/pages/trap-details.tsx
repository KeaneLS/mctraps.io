import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Navbar from '../components/Navbar';
import { darkTheme, lightTheme, AppThemeMode } from '../theme';
import { readTrapById, readTrapComments, PaginatedComments, resolveUserProfiles, UserProfile, addComment, setCommentVote, readUserCommentVotes, editComment, softDeleteComment, setTrapRating } from '../firebase/dataAccess';
import Avatar from '@mui/material/Avatar';
import InputBase from '@mui/material/InputBase';
import { useAuth } from '../firebase/authContext';
import { S as TierS, A as TierA, B as TierB, C as TierC, D as TierD, E as TierE, F as TierF } from '../tiers';
import { VerifiedUser } from '@mui/icons-material';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlined from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbUpAlt from '@mui/icons-material/ThumbUpAlt';
import ThumbDownAlt from '@mui/icons-material/ThumbDownAlt';
import ReplyOutlined from '@mui/icons-material/ReplyOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

function getTierFromAverage(avg?: number) {
  const rounded = Math.max(0, Math.min(6, Math.round(avg ?? 0)));
  return (
    rounded === 6 ? TierS :
    rounded === 5 ? TierA :
    rounded === 4 ? TierB :
    rounded === 3 ? TierC :
    rounded === 2 ? TierD :
    rounded === 1 ? TierE :
    TierF
  );
}

const TrapDetailsPage: React.FC = () => {
  const { id: trapId } = useParams<{ id: string }>();
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
  const toggleMode = React.useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('themeMode', mode);
    } catch {}
  }, [mode]);

  const [trap, setTrap] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [comments, setComments] = React.useState<PaginatedComments>({ byId: {}, ids: [], hasMore: false });
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [cursor, setCursor] = React.useState<any | undefined>(undefined);
  const [profiles, setProfiles] = React.useState<Record<string, UserProfile>>({});
  const [newComment, setNewComment] = React.useState<string>("");
  const [replyDrafts, setReplyDrafts] = React.useState<Record<string, string>>({});
  const [editingDrafts, setEditingDrafts] = React.useState<Record<string, string>>({});
  const [menuAnchors, setMenuAnchors] = React.useState<Record<string, HTMLElement | null>>({});
  const [userVotes, setUserVotes] = React.useState<Record<string, 1 | -1 | 0>>({});
  const { currentUser } = useAuth();
  const [composerProfile, setComposerProfile] = React.useState<UserProfile | null>(null);
  const [ratingChoice, setRatingChoice] = React.useState<'' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('');
  const [showRatingLoginPrompt, setShowRatingLoginPrompt] = React.useState(false);
  const TierByLetter: Record<'S'|'A'|'B'|'C'|'D'|'E'|'F', React.FC<{ size?: number }>> = React.useMemo(() => ({
    S: TierS,
    A: TierA,
    B: TierB,
    C: TierC,
    D: TierD,
    E: TierE,
    F: TierF,
  }), []);
  const TierText: Record<'S'|'A'|'B'|'C'|'D'|'E'|'F', string> = React.useMemo(() => ({
    S: 'Supreme',
    A: 'Excellent',
    B: 'Strong',
    C: 'Decent',
    D: 'Weak',
    E: 'Poor',
    F: 'Awful',
  }), []);
  const letterToValue = React.useCallback((letter: 'S'|'A'|'B'|'C'|'D'|'E'|'F'): 0|1|2|3|4|5|6 => (
    letter === 'S' ? 6 :
    letter === 'A' ? 5 :
    letter === 'B' ? 4 :
    letter === 'C' ? 3 :
    letter === 'D' ? 2 :
    letter === 'E' ? 1 : 0
  ), []);
  const ensureComposerProfileInMap = React.useCallback(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    setProfiles((prev) => {
      if (prev[uid]) return prev;
      const entry: UserProfile = {
        displayName: composerProfile?.displayName || currentUser.displayName || null,
        photoURL: composerProfile?.photoURL || currentUser.photoURL || null,
        discordUsername: composerProfile?.discordUsername || null,
      };
      return { ...prev, [uid]: entry };
    });
  }, [currentUser, composerProfile]);

  const addOptimisticComment = React.useCallback((body: string, parentTopId?: string) => {
    if (!currentUser) return null;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const uid = currentUser.uid;
    const nowIso = new Date().toISOString();
    const isReply = !!parentTopId;
    const entity: any = {
      id: tempId,
      authorId: uid,
      body,
      createdAt: nowIso,
      parentId: isReply ? parentTopId : null,
      threadId: isReply ? parentTopId : tempId,
      depth: isReply ? 1 : 0,
      replyCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      score: 0,
      status: 'visible',
    };
    setComments((prev) => {
      const nextById = { ...prev.byId, [tempId]: entity } as any;
      let nextIds = [...prev.ids];
      if (isReply) {
        nextIds.push(tempId);
      } else {
        const getScore = (c: any) => (typeof c?.score === 'number'
          ? c.score
          : (Number(c?.likeCount || 0) - Number(c?.dislikeCount || 0)));
        const topIds = prev.ids.filter((cid) => (prev.byId[cid]?.depth ?? 0) === 0);
        const others = prev.ids.filter((cid) => (prev.byId[cid]?.depth ?? 0) !== 0);
        const combinedById = { ...nextById } as any;
        const sortedTop = [...topIds, tempId].sort((a, b) => {
          const ca = a === tempId ? entity : combinedById[a];
          const cb = b === tempId ? entity : combinedById[b];
          const sa = getScore(ca);
          const sb = getScore(cb);
          if (sa !== sb) return sb - sa; // score desc
          const ta = new Date(ca.createdAt || 0).getTime();
          const tb = new Date(cb.createdAt || 0).getTime();
          return ta - tb; // createdAt asc
        });
        nextIds = [...sortedTop, ...others];
      }
      return { ...prev, byId: nextById, ids: nextIds } as PaginatedComments;
    });
    setTrap((prev: any) => prev ? ({ ...prev, commentCount: (Number(prev.commentCount || 0) + 1) }) : prev);
    ensureComposerProfileInMap();
    return tempId;
  }, [currentUser, ensureComposerProfileInMap]);

  const replaceOptimisticCommentId = React.useCallback((tempId: string, realId: string, threadId?: string) => {
    setComments((prev) => {
      const temp = prev.byId[tempId];
      if (!temp) return prev;
      const updated = { ...temp, id: realId, threadId: threadId || temp.threadId } as any;
      const nextById = { ...prev.byId } as any;
      delete nextById[tempId];
      nextById[realId] = updated;
      const nextIds = prev.ids.map((id) => id === tempId ? realId : id);
      return { ...prev, byId: nextById, ids: nextIds } as PaginatedComments;
    });
  }, []);

  const removeOptimisticComment = React.useCallback((tempId: string) => {
    setComments((prev) => {
      if (!prev.byId[tempId]) return prev;
      const nextById = { ...prev.byId } as any;
      delete nextById[tempId];
      const nextIds = prev.ids.filter((id) => id !== tempId);
      return { ...prev, byId: nextById, ids: nextIds } as PaginatedComments;
    });
    setTrap((prev: any) => prev ? ({ ...prev, commentCount: Math.max(0, Number(prev.commentCount || 0) - 1) }) : prev);
  }, []);
  const applyVoteOptimistic = React.useCallback((commentId: string, previous: 1 | 0 | -1, next: 1 | 0 | -1) => {
    const delta = (next - previous);
    setUserVotes((prev) => ({ ...prev, [commentId]: next }));
    setComments((prev) => {
      const current = prev.byId[commentId];
      if (!current) return prev;
      const baseScore = typeof current.score === 'number'
        ? current.score
        : (Number(current.likeCount || 0) - Number(current.dislikeCount || 0));
      const updated = { ...current, score: baseScore + delta } as any;
      return { ...prev, byId: { ...prev.byId, [commentId]: updated } };
    });
  }, []);

  const renderBody = React.useCallback((text: string) => {
    const parts = text.split(/(\s+)/);
    return (
      <>
        {parts.map((part, idx) => {
          if (part.startsWith('@') && part.length > 1 && !part.match(/\s/)) {
            return (
              <Typography key={idx} component="span" sx={{ color: 'brand.main' }}>
                {part}
              </Typography>
            );
          }
          return <Typography key={idx} component="span">{part}</Typography>;
        })}
      </>
    );
  }, []);

  const sanitizeNameKey = (name?: string | null) => String(name || '')
    .replace(/\s+/g, '')
    .toLowerCase();

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!trapId) return;
      try {
        const { getTrapFromCache } = await import('../firebase/dataAccess');
        const cached = getTrapFromCache(trapId);
        if (!cancelled && cached) {
          setTrap(cached);
          setLoading(false);
        }
      } catch {}

      if (!cancelled && !trap) {
        setLoading(true);
      }

      try {
        const t = await readTrapById(trapId);
        if (!cancelled) setTrap(t);
      } catch (e) {
        if (!cancelled && !trap) setError((e as Error).message);
      } finally {
        if (!cancelled && !trap) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [trapId]);

  const loadComments = React.useCallback(async (opts?: { reset?: boolean }) => {
    if (!trapId) return;
    setCommentsLoading(true);
    try {
      const useCursor = opts?.reset ? undefined : cursor;
      const res = await readTrapComments(trapId, { cursor: useCursor as any, pageSize: 20 });
      setComments((prev) => {
        const nextById = (opts?.reset ? {} : { ...prev.byId }) as PaginatedComments['byId'];
        const nextIds = opts?.reset ? [] as string[] : [...prev.ids];
        res.ids.forEach((cid) => {
          if (!nextById[cid]) {
            nextById[cid] = res.byId[cid];
            nextIds.push(cid);
          }
        });
        return {
          byId: nextById,
          ids: nextIds,
          nextCursor: res.nextCursor,
          hasMore: res.hasMore,
        } as PaginatedComments;
      });
      setCursor(res.nextCursor);

      const authorIds = Array.from(new Set(res.ids.map((cid) => res.byId[cid]?.authorId).filter(Boolean)));
      if (authorIds.length) {
        const resolved = await resolveUserProfiles(authorIds as string[]);
        setProfiles((prev) => ({ ...prev, ...resolved }));
      }
      if (currentUser && trapId && res.ids.length) {
        const votes = await readUserCommentVotes(trapId, res.ids, currentUser.uid);
        setUserVotes((prev) => ({ ...prev, ...votes }));
      }
    } finally {
      setCommentsLoading(false);
    }
  }, [trapId, cursor]);

  React.useEffect(() => {
    setComments({ byId: {}, ids: [], hasMore: false });
    setCursor(undefined);
    setProfiles({});
  }, [trapId]);

  React.useEffect(() => {
    (async () => {
      if (!currentUser) { setComposerProfile(null); return; }
      try {
        const res = await resolveUserProfiles([currentUser.uid]);
        const one = res[currentUser.uid];
        setComposerProfile(one || null);
      } catch {
        setComposerProfile(null);
      }
    })();
  }, [currentUser]);

  React.useEffect(() => {
    if (trapId) {
      loadComments();
    }
  }, [trapId]);

  if (loading && !trap) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !trap) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <Typography variant="body1">Failed to load trap.</Typography>
      </Box>
    );
  }

  const countForTier = (trap?.tierlistRating?.count ?? trap?.rating?.count ?? 0) as number;
  const avgForTier = (countForTier > 0
    ? (trap?.tierlistRating?.average ?? trap?.rating?.average ?? 0)
    : null) as number | null;
  const Tier = getTierFromAverage(avgForTier ?? undefined);

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;
  const surfaceBg = currentTheme.palette.mode === 'light' ? '#ECECED' : '#262628';
  const surfaceBorder = alpha(currentTheme.palette.light.main, 0.12);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Navbar mode={mode} onToggleTheme={toggleMode} />
      <Box sx={{ height: 96 }} />
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
          bgcolor: currentTheme.palette.background.default,
          borderRadius: 2,
          zIndex: -1,
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative', zIndex: 1, mt: -1.15 }}>

        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, bgcolor: surfaceBg, border: `1px solid ${surfaceBorder}` }}>
          <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden' }}>
            <Box
              component="iframe"
              src={trap?.video?.embedUrl}
              title={trap.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
            />
          </Box>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Paper elevation={0} sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: surfaceBg, border: `1px solid ${surfaceBorder}` }}>
            <Stack spacing={1}>
              <Typography variant="h5">{trap.name}</Typography>
              <Divider sx={{ borderColor: surfaceBorder }} />
              <Typography variant="body1" sx={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>
                {trap?.description || 'No description provided.'}
              </Typography>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: surfaceBg, border: `1px solid ${surfaceBorder}` }}>
            <Stack spacing={1}>
              <Typography variant="h5">Details</Typography>
              <Divider sx={{ borderColor: surfaceBorder }} />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1"><strong>Tier:</strong></Typography>
                {countForTier > 0 && <Tier size={24} />}
                {(() => {
                  const cnt = countForTier;
                  const label = cnt > 0 ? `${cnt} ratings` : 'No ratings';
                  return (
                    <Typography variant="body1" sx={{ opacity: 0.7 }}>({label})</Typography>
                  );
                })()}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Select
                  size="small"
                  displayEmpty
                  value={ratingChoice}
                  onChange={(e) => setRatingChoice((e.target.value as any) || '')}
                  renderValue={(selected) => (
                    selected ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {(() => { const C = TierByLetter[selected as 'S']; return <C size={20} />; })()}
                        <Typography variant="body2">Rate Trap</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">Rate Trap</Typography>
                    )
                  )}
                  sx={{
                    minWidth: 120,
                    height: 36,
                    px: 1,
                    borderRadius: 2,
                    boxShadow: 'none',
                    bgcolor: alpha(currentTheme.palette.light.main, 0.04),
                    transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      bgcolor: alpha(currentTheme.palette.light.main, 0.1),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(currentTheme.palette.light.main, 0.2),
                      },
                    },
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      py: 0,
                      height: 34,
                      lineHeight: '34px',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: `1px solid ${surfaceBorder}`,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(currentTheme.palette.light.main, 0.2),
                    },
                    '&.Mui-disabled': {
                      bgcolor: alpha(currentTheme.palette.light.main, 0.14),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(currentTheme.palette.light.main, 0.18),
                      },
                      color: currentTheme.palette.light.main,
                      transform: 'none',
                    },
                  }}
                >
                  {/* Intentionally no placeholder menu item; title is renderValue */}
                  {(['S','A','B','C','D','E','F'] as const).map((t) => {
                    const Comp = TierByLetter[t];
                    return (
                      <MenuItem
                        key={t}
                        value={t}
                        sx={{
                          '&.Mui-selected': {
                            bgcolor: mode === 'dark'
                              ? alpha(currentTheme.palette.light.main, 0.14)
                              : alpha(currentTheme.palette.dark.main, 0.14),
                            color: mode === 'dark'
                              ? currentTheme.palette.light.main
                              : currentTheme.palette.dark.main,
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: mode === 'dark'
                              ? alpha(currentTheme.palette.light.main, 0.18)
                              : alpha(currentTheme.palette.dark.main, 0.18),
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Comp size={22} />
                          <Typography variant="body2">{TierText[t]}</Typography>
                        </Stack>
                      </MenuItem>
                    );
                  })}
                </Select>
                <Button
                  variant="outlined"
                  color="brand"
                  disabled={!ratingChoice}
                  onClick={async () => {
                    if (!trapId || !ratingChoice) return;
                    if (!currentUser) {
                      setShowRatingLoginPrompt(true);
                      return;
                    }
                    try {
                      const res = await setTrapRating(trapId, letterToValue(ratingChoice as any));
                      setTrap((prev: any) => prev ? ({
                        ...prev,
                        tierlistRating: { average: res.average, count: res.count },
                      }) : prev);
                      setRatingChoice('');
                      setShowRatingLoginPrompt(false);
                    } catch {}
                  }}
                  sx={{
                    textTransform: 'none',
                    height: 36,
                    px: 1.25,
                    borderRadius: 2,
                    color: 'dark.main',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                    bgcolor: currentTheme.palette.brand.main,
                    boxShadow: 'none',
                    transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      borderColor: alpha(currentTheme.palette.brand.main, 0.6),
                    },
                    '&:active': { transform: 'translateY(0)' },
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
                  Submit
                </Button>
                {showRatingLoginPrompt && !currentUser && (
                  <Typography
                    variant="body1"
                    sx={{ ml: 1, opacity: 0.8 }}
                  >
                    <Box
                      component="span"
                      onClick={() => navigate('/login')}
                      sx={{ color: currentTheme.palette.brand.main, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Sign in
                    </Box>
                    {` to rate traps`}
                  </Typography>
                )}
              </Stack>
              <Typography variant="body1"><strong>Creators:</strong> {Array.isArray(trap.creators) ? trap.creators.join(', ') : ''}</Typography>
              <Typography variant="body1"><strong>Date Invented:</strong> {trap.dateInvented}</Typography>
              <Typography variant="body1"><strong>Minigame:</strong> {trap.minigame}</Typography>
              <Typography variant="body1"><strong>Type:</strong> {trap.type}</Typography>
            </Stack>
          </Paper>
        </Stack>

        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, bgcolor: surfaceBg, border: `1px solid ${surfaceBorder}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">Comments</Typography>
            <Typography variant="body1" sx={{ opacity: 0.7 }}>{trap.commentCount ?? 0} total</Typography>
          </Stack>
          <Divider sx={{ my: 1, borderColor: surfaceBorder }} />

          <Stack spacing={1.25} sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar src={composerProfile?.photoURL || currentUser?.photoURL || undefined} sx={{ width: 32, height: 32 }} />
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography variant="body1" noWrap>
                  {composerProfile?.displayName || currentUser?.displayName || 'You'}
                </Typography>
                {composerProfile?.discordUsername && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                  <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 18, width: 18 }} />
                  <Typography variant="body1" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700}}>
                    {composerProfile.discordUsername}
                  </Typography>
                </Stack>
                )}
              </Stack>
            </Stack>
            <Paper elevation={0} sx={{ p: 0.5, borderRadius: 2, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}`, position: 'relative' }}>
              <InputBase
                placeholder={
                  (composerProfile?.displayName || currentUser?.displayName)
                    ? 'Add a comment…'
                    : (currentUser ? '' : '')
                }
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName)}
                multiline
                minRows={1}
                sx={(theme) => ({
                  px: 1,
                  py: 0.5,
                  width: '100%',
                  '& .MuiInputBase-input::placeholder': {
                    ...theme.typography.body1,
                  },
                  '& .MuiInputBase-input': {
                    ...theme.typography.body1,
                  },
                  '& .MuiInputBase-inputMultiline': {
                    ...theme.typography.body1,
                  },
                })}
              />
              {(!currentUser || !(composerProfile?.displayName || currentUser?.displayName)) && (
                <Typography
                  variant="body1"
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: 10,
                    pointerEvents: 'auto',
                    opacity: 0.8,
                  }}
                >
                  {(!currentUser) ? (
                    <>
                      <Box
                        component="span"
                        onClick={() => navigate('/login')}
                        sx={{ color: currentTheme.palette.brand.main, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Sign in
                      </Box>
                      {` to comment`}
                    </>
                  ) : (
                    <>
                      <Box
                        component="span"
                        onClick={() => navigate('/profile')}
                        sx={{ color: currentTheme.palette.brand.main, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Create a username
                      </Box>
                      {` to comment`}
                    </>
                  )}
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 0.5, pb: 0.5 }}>
                <Button
                  variant="outlined"
                  color="brand"
                  disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName) || !newComment.trim()}
                  onClick={() => {
                    if (!trapId) return;
                    const body = newComment.trim();
                    if (!body) return;
                    const tempId = addOptimisticComment(body);
                    setNewComment("");
                    if (!tempId) return;
                    addComment({ trapId: trapId, body })
                      .then((res) => {
                        replaceOptimisticCommentId(tempId, res.id, res.threadId);
                      })
                      .catch(() => {
                        removeOptimisticComment(tempId);
                      });
                  }}
                  sx={{
                    textTransform: 'none',
                    height: 36,
                    px: 1.25,
                    borderRadius: 2,
                    color: 'dark.main',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                    bgcolor: currentTheme.palette.brand.main,
                    boxShadow: 'none',
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
                  Post
                </Button>
              </Box>
            </Paper>
          </Stack>

          <Stack spacing={1.25}>
            {(() => {
              const topLevel = comments.ids.filter((cid) => (comments.byId[cid]?.depth ?? 0) === 0);
              return topLevel.map((topId) => {
                const top = comments.byId[topId];
                const topProfile = top?.authorId ? profiles[top.authorId] : undefined;
                const replies = comments.ids.filter((cid) => cid !== topId && comments.byId[cid]?.threadId === topId);
                return (
                  <Box key={topId} sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.04), border: `1px solid ${surfaceBorder}` }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar src={(top?.status === 'deleted') ? undefined : (topProfile?.photoURL || undefined)} sx={{ width: 28, height: 28 }} />
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" noWrap>
                          {(top?.status === 'deleted') ? '(deleted)' : (topProfile?.displayName || 'Anonymous')}{(top?.status === 'edited') ? ' ' : ''}
                          {(top?.status === 'edited') ? (
                            <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                              (edited)
                            </Typography>
                          ) : null}
                        </Typography>
                        {(top?.status !== 'deleted' && topProfile?.discordUsername) && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 18, width: 18 }} />
                            <Typography variant="body1" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700 }} noWrap>
                              {topProfile.discordUsername}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      {top.status !== 'deleted' && (
                        <Typography variant="body1" sx={{ opacity: 0.7 }}>
                          {new Date(top.createdAt).toLocaleString()}
                        </Typography>
                      )}
                      {currentUser && top.authorId === currentUser.uid && top.status !== 'deleted' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={(e) => setMenuAnchors((p) => ({ ...p, [top.id]: e.currentTarget }))}
                          >
                            <MoreVert sx={{ width: 20, height: 20 }} />
                          </IconButton>
                          <Menu
                            anchorEl={menuAnchors[top.id] || null}
                            open={Boolean(menuAnchors[top.id])}
                            onClose={() => setMenuAnchors((p) => ({ ...p, [top.id]: null }))}
                          >
                            <MenuItem onClick={() => {
                              setEditingDrafts((p) => ({ ...p, [top.id]: comments.byId[top.id]?.body || '' }));
                              setMenuAnchors((p) => ({ ...p, [top.id]: null }));
                            }}>Edit</MenuItem>
                            <MenuItem onClick={() => {
                              if (!trapId) return;
                              const prev = comments.byId[top.id];
                              setComments((p) => ({ ...p, byId: { ...p.byId, [top.id]: { ...prev, status: 'deleted' } as any } as any } as any));
                              setMenuAnchors((p) => ({ ...p, [top.id]: null }));
                              softDeleteComment(trapId, top.id).catch(() => {
                                setComments((p) => ({ ...p, byId: { ...p.byId, [top.id]: prev } } as any));
                              });
                            }}>Delete</MenuItem>
                          </Menu>
                        </>
                      )}
                    </Stack>
                    {editingDrafts[top.id] !== undefined ? (
                      <Box sx={{ mt: 0.75 }}>
                        <Paper elevation={0} sx={{ p: 0.5, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}` }}>
                          <InputBase
                            value={editingDrafts[top.id]}
                            onChange={(e) => setEditingDrafts((p) => ({ ...p, [top.id]: e.target.value }))}
                            multiline
                            minRows={1}
                            sx={{ px: 1, py: 0.5, width: '100%' }}
                          />
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', px: 0.5, pb: 0.5 }}>
                            <Button
                              variant="outlined"
                              color="brand"
                              disabled={!editingDrafts[top.id]?.trim()}
                              onClick={() => {
                                if (!trapId) return;
                                const value = (editingDrafts[top.id] || '').trim();
                                const prev = comments.byId[top.id];
                                setEditingDrafts((p) => { const n = { ...p }; delete n[top.id]; return n; });
                                setComments((p) => ({ ...p, byId: { ...p.byId, [top.id]: { ...prev, body: value, status: 'edited' } as any } } as any));
                                editComment(trapId, top.id, value).catch(() => {
                                  setComments((p) => ({ ...p, byId: { ...p.byId, [top.id]: prev } } as any));
                                });
                              }}
                              sx={{
                                textTransform: 'none',
                                height: 36,
                                px: 1.25,
                                borderRadius: 2,
                                color: 'dark.main',
                                position: 'relative',
                                overflow: 'hidden',
                                border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                                bgcolor: currentTheme.palette.brand.main,
                                boxShadow: 'none',
                                transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  borderColor: alpha(currentTheme.palette.brand.main, 0.6),
                                },
                                '&:active': { transform: 'translateY(0)' },
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
                              Post
                            </Button>
                            <Button
                              variant="text"
                              color="inherit"
                              onClick={() => setEditingDrafts((p) => { const n = { ...p }; delete n[top.id]; return n; })}
                              sx={{ textTransform: 'none', height: 36, px: 1 }}
                            >
                              Cancel
                            </Button>
                          </Stack>
                        </Paper>
                      </Box>
                    ) : (
                      <Typography sx={{ mt: 0.75 }}>{top?.status === 'deleted' ? '(deleted)' : renderBody(top.body)}</Typography>
                    )}
                    {top.status !== 'deleted' && (
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, alignItems: 'center' }}>
                      <IconButton size="small" color="inherit" onClick={() => {
                        if (!trapId) return;
                        const prev = userVotes[top.id] ?? 0;
                        const next = prev === 1 ? 0 : 1;
                        applyVoteOptimistic(top.id, prev as 1 | 0 | -1, next as 1 | 0 | -1);
                        setCommentVote(trapId, top.id, next as 1 | -1 | 0).catch(() => {
                          applyVoteOptimistic(top.id, next as 1 | 0 | -1, prev as 1 | 0 | -1);
                        });
                      }}>
                        {(userVotes[top.id] === 1 ? <ThumbUpAlt fontSize="small" /> : <ThumbUpAltOutlined fontSize="small" />)}
                      </IconButton>
                      <Typography variant="caption" sx={{ opacity: 0.8, minWidth: 16, textAlign: 'center' }}>
                        {typeof top.score === 'number' ? top.score : (Number(top.likeCount||0) - Number(top.dislikeCount||0))}
                      </Typography>
                      <IconButton size="small" color="inherit" onClick={() => {
                        if (!trapId) return;
                        const prev = userVotes[top.id] ?? 0;
                        const next = prev === -1 ? 0 : -1;
                        applyVoteOptimistic(top.id, prev as 1 | 0 | -1, next as 1 | 0 | -1);
                        setCommentVote(trapId, top.id, next as 1 | -1 | 0).catch(() => {
                          applyVoteOptimistic(top.id, next as 1 | 0 | -1, prev as 1 | 0 | -1);
                        });
                      }}>
                        {(userVotes[top.id] === -1 ? <ThumbDownAlt fontSize="small" /> : <ThumbDownAltOutlined fontSize="small" />)}
                      </IconButton>
                      <Button size="small" variant="text" color="inherit" onClick={() => setReplyDrafts((p) => ({ ...p, [top.id]: p[top.id] || '' }))} sx={{ textTransform: 'none' }}>Reply</Button>
                    </Stack>
                    )}
                    {replyDrafts[top.id] !== undefined && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Avatar src={composerProfile?.photoURL || currentUser?.photoURL || undefined} sx={{ width: 24, height: 24 }} />
                        <Box sx={{ flex: 1 }}>
                          <Paper elevation={0} sx={{ p: 0.5, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}` }}>
                            <InputBase
                              placeholder="Add a reply…"
                              value={replyDrafts[top.id]}
                              onChange={(e) => setReplyDrafts((p) => ({ ...p, [top.id]: e.target.value }))}
                              multiline
                              minRows={1}
                              sx={(theme) => ({
                                px: 1,
                                py: 0.5,
                                width: '100%',
                                '& .MuiInputBase-input::placeholder': {
                                  ...theme.typography.body1,
                                },
                                '& .MuiInputBase-input': {
                                  ...theme.typography.body1,
                                },
                                '& .MuiInputBase-inputMultiline': {
                                  ...theme.typography.body1,
                                },
                              })}
                              disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName)}
                            />
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 0.5, pb: 0.5 }}>
                              <Button
                                variant="outlined"
                                color="brand"
                                disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName) || !replyDrafts[top.id]?.trim()}
                                onClick={() => {
                                  if (!trapId) return;
                                  const body = (replyDrafts[top.id] || '').trim();
                                  if (!body) return;
                                  const tempId = addOptimisticComment(body, top.id);
                                  setReplyDrafts((p) => { const n = { ...p }; delete n[top.id]; return n; });
                                  if (!tempId) return;
                                  addComment({ trapId: trapId, body, parentId: top.id })
                                    .then((res) => {
                                      replaceOptimisticCommentId(tempId, res.id, res.threadId);
                                    })
                                    .catch(() => {
                                      removeOptimisticComment(tempId);
                                    });
                                }}
                                sx={{
                                  textTransform: 'none',
                                  height: 32,
                                  px: 1,
                                  borderRadius: 2,
                                  color: 'dark.main',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                                  bgcolor: currentTheme.palette.brand.main,
                                  boxShadow: 'none',
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
                                Post
                              </Button>
                            </Box>
                          </Paper>
                        </Box>
                      </Stack>
                    )}

                    {replies.length > 0 && (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {replies.map((rid) => {
                          const r = comments.byId[rid];
                          const rProfile = r?.authorId ? profiles[r.authorId] : undefined;
                          return (
                            <Box key={rid} sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}` }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Avatar src={(r?.status === 'deleted') ? undefined : (rProfile?.photoURL || undefined)} sx={{ width: 24, height: 24 }} />
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap>
                                    {(r?.status === 'deleted') ? '(deleted)' : (rProfile?.displayName || 'Anonymous')}{(r?.status === 'edited') ? ' ' : ''}
                                    {(r?.status === 'edited') ? (
                                      <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                                        (edited)
                                      </Typography>
                                    ) : null}
                                  </Typography>
                                  {(r?.status !== 'deleted' && rProfile?.discordUsername) && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                      <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 16, width: 16 }} />
                                      <Typography variant="body2" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700 }} noWrap>
                                        {rProfile.discordUsername}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Stack>
                                {r.status !== 'deleted' && (
                                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                    {new Date(r.createdAt).toLocaleString()}
                                  </Typography>
                                )}
                                {currentUser && r.authorId === currentUser.uid && r.status !== 'deleted' && (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => setMenuAnchors((p) => ({ ...p, [r.id]: e.currentTarget }))}
                                    >
                                      <MoreVert sx={{ width: 18, height: 18 }} />
                                    </IconButton>
                                    <Menu
                                      anchorEl={menuAnchors[r.id] || null}
                                      open={Boolean(menuAnchors[r.id])}
                                      onClose={() => setMenuAnchors((p) => ({ ...p, [r.id]: null }))}
                                    >
                                      <MenuItem onClick={() => {
                                        setEditingDrafts((p) => ({ ...p, [r.id]: comments.byId[r.id]?.body || '' }));
                                        setMenuAnchors((p) => ({ ...p, [r.id]: null }));
                                      }}>Edit</MenuItem>
                                      <MenuItem onClick={() => {
                                        if (!trapId) return;
                                        const prev = comments.byId[r.id];
                                        setComments((p) => ({ ...p, byId: { ...p.byId, [r.id]: { ...prev, status: 'deleted' } as any } } as any));
                                        setMenuAnchors((p) => ({ ...p, [r.id]: null }));
                                        softDeleteComment(trapId, r.id).catch(() => {
                                          setComments((p) => ({ ...p, byId: { ...p.byId, [r.id]: prev } } as any));
                                        });
                                      }}>Delete</MenuItem>
                                    </Menu>
                                  </>
                                )}
                              </Stack>
                              {editingDrafts[r.id] !== undefined ? (
                                <Box sx={{ mt: 0.5 }}>
                                  <Paper elevation={0} sx={{ p: 0.5, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}` }}>
                                    <InputBase
                                      value={editingDrafts[r.id]}
                                      onChange={(e) => setEditingDrafts((p) => ({ ...p, [r.id]: e.target.value }))}
                                      multiline
                                      minRows={1}
                                      sx={{ px: 1, py: 0.5, width: '100%' }}
                                    />
                                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', px: 0.5, pb: 0.5 }}>
                                      <Button
                                        variant="outlined"
                                        color="brand"
                                        disabled={!editingDrafts[r.id]?.trim()}
                                        onClick={() => {
                                          if (!trapId) return;
                                          const value = (editingDrafts[r.id] || '').trim();
                                          const prev = comments.byId[r.id];
                                          setEditingDrafts((p) => { const n = { ...p }; delete n[r.id]; return n; });
                                          setComments((p) => ({ ...p, byId: { ...p.byId, [r.id]: { ...prev, body: value, status: 'edited' } as any } } as any));
                                          editComment(trapId, r.id, value).catch(() => {
                                            setComments((p) => ({ ...p, byId: { ...p.byId, [r.id]: prev } } as any));
                                          });
                                        }}
                                        sx={{
                                          textTransform: 'none',
                                          height: 36,
                                          px: 1.25,
                                          borderRadius: 2,
                                          color: 'dark.main',
                                          position: 'relative',
                                          overflow: 'hidden',
                                          border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                                          bgcolor: currentTheme.palette.brand.main,
                                          boxShadow: 'none',
                                          transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                                          '&:hover': {
                                            transform: 'translateY(-1px)',
                                            borderColor: alpha(currentTheme.palette.brand.main, 0.6),
                                          },
                                          '&:active': { transform: 'translateY(0)' },
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
                                        Post
                                      </Button>
                                      <Button
                                        variant="text"
                                        color="inherit"
                                        onClick={() => setEditingDrafts((p) => { const n = { ...p }; delete n[r.id]; return n; })}
                                        sx={{ textTransform: 'none', height: 36, px: 1 }}
                                      >
                                        Cancel
                                      </Button>
                                    </Stack>
                                  </Paper>
                                </Box>
                              ) : (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{r?.status === 'deleted' ? '(deleted)' : renderBody(r.body)}</Typography>
                              )}
                              {r.status !== 'deleted' && (
                              <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, alignItems: 'center' }}>
                                <IconButton size="small" color="inherit" onClick={() => {
                                  if (!trapId) return;
                                  const prev = userVotes[r.id] ?? 0;
                                  const next = prev === 1 ? 0 : 1;
                                  applyVoteOptimistic(r.id, prev as 1 | 0 | -1, next as 1 | 0 | -1);
                                  setCommentVote(trapId, r.id, next as 1 | -1 | 0).catch(() => {
                                    applyVoteOptimistic(r.id, next as 1 | 0 | -1, prev as 1 | 0 | -1);
                                  });
                                }}>
                                  {(userVotes[r.id] === 1 ? <ThumbUpAlt fontSize="small" /> : <ThumbUpAltOutlined fontSize="small" />)}
                                </IconButton>
                                <Typography variant="caption" sx={{ opacity: 0.8, minWidth: 16, textAlign: 'center' }}>
                                  {typeof r.score === 'number' ? r.score : (Number(r.likeCount||0) - Number(r.dislikeCount||0))}
                                </Typography>
                                <IconButton size="small" color="inherit" onClick={() => {
                                  if (!trapId) return;
                                  const prev = userVotes[r.id] ?? 0;
                                  const next = prev === -1 ? 0 : -1;
                                  applyVoteOptimistic(r.id, prev as 1 | 0 | -1, next as 1 | 0 | -1);
                                  setCommentVote(trapId, r.id, next as 1 | -1 | 0).catch(() => {
                                    applyVoteOptimistic(r.id, next as 1 | 0 | -1, prev as 1 | 0 | -1);
                                  });
                                }}>
                                  {(userVotes[r.id] === -1 ? <ThumbDownAlt fontSize="small" /> : <ThumbDownAltOutlined fontSize="small" />)}
                                </IconButton>
                                <Button size="small" variant="text" color="inherit" onClick={() => {
                                  setReplyDrafts((p) => {
                                    const dn = (rProfile?.displayName || 'user').replace(/\s+/g, '');
                                    const mention = `@${dn} `;
                                    const existing = p[r.id] || '';
                                    const prefilled = existing || mention;
                                    return { ...p, [r.id]: prefilled };
                                  });
                                }} sx={{ textTransform: 'none' }}>Reply</Button>
                              </Stack>
                              )}
                              {replyDrafts[r.id] !== undefined && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                  <Avatar src={composerProfile?.photoURL || currentUser?.photoURL || undefined} sx={{ width: 24, height: 24 }} />
                                  <Box sx={{ flex: 1 }}>
                                    <Paper elevation={0} sx={{ p: 0.5, borderRadius: 1.5, bgcolor: alpha(currentTheme.palette.light.main, 0.02), border: `1px solid ${surfaceBorder}` }}>
                                      <InputBase
                                        placeholder="Add a reply…"
                                        value={replyDrafts[r.id]}
                                        onChange={(e) => setReplyDrafts((p) => ({ ...p, [r.id]: e.target.value }))}
                                        multiline
                                        minRows={1}
                                        sx={(theme) => ({
                                          px: 1,
                                          py: 0.5,
                                          width: '100%',
                                          '& .MuiInputBase-input::placeholder': {
                                            ...theme.typography.body1,
                                          },
                                          '& .MuiInputBase-input': {
                                            ...theme.typography.body1,
                                          },
                                          '& .MuiInputBase-inputMultiline': {
                                            ...theme.typography.body1,
                                          },
                                        })}
                                        disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName)}
                                      />
                                      
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 0.5, pb: 0.5 }}>
                                        <Button
                                          variant="outlined"
                                          color="brand"
                                          disabled={!currentUser || !(composerProfile?.displayName || currentUser?.displayName) || !replyDrafts[r.id]?.trim()}
                                          onClick={() => {
                                            if (!trapId) return;
                                            const body = (replyDrafts[r.id] || '').trim();
                                            if (!body) return;
                                            const tempId = addOptimisticComment(body, topId);
                                            setReplyDrafts((p) => { const n = { ...p }; delete n[r.id]; return n; });
                                            if (!tempId) return;
                                            addComment({ trapId: trapId, body, parentId: r.id })
                                              .then((res) => {
                                                replaceOptimisticCommentId(tempId, res.id, res.threadId);
                                              })
                                              .catch(() => {
                                                removeOptimisticComment(tempId);
                                              });
                                          }}
                                          sx={{
                                            textTransform: 'none',
                                            height: 32,
                                            px: 1,
                                            borderRadius: 2,
                                            color: 'dark.main',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: `1px solid ${alpha(currentTheme.palette.brand.main, 0.45)}`,
                                            bgcolor: currentTheme.palette.brand.main,
                                            boxShadow: 'none',
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
                                          Post
                                        </Button>
                                      </Box>
                                    </Paper>
                                  </Box>
                                </Stack>
                              )}
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                );
              });
            })()}

            {!commentsLoading && comments.hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="text"
                  color="inherit"
                  onClick={() => { void loadComments(); }}
                  sx={{
                    textTransform: 'none',
                    px: 1.25,
                    minWidth: 0,
                    borderRadius: 2,
                    bgcolor: 'transparent',
                    color: 'text.primary',
                    '&:hover': { bgcolor: alpha(currentTheme.palette.light.main, 0.06) }
                  }}
                >
                  Load more
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
    </ThemeProvider>
  );
};

export default TrapDetailsPage;


