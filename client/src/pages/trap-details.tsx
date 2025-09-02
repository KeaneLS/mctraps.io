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
import { readTrapById, readTrapComments, PaginatedComments, resolveUserProfiles, UserProfile, addComment, setCommentVote, readUserCommentVotes } from '../firebase/dataAccess';
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
  const [userVotes, setUserVotes] = React.useState<Record<string, 1 | -1 | 0>>({});
  const { currentUser } = useAuth();
  const [composerProfile, setComposerProfile] = React.useState<UserProfile | null>(null);
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

  const Tier = getTierFromAverage(trap?.tierlistRating?.average ?? trap?.rating?.average ?? 0);

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
                <Tier size={24} />
                <Typography variant="body1" sx={{ opacity: 0.7 }}>({trap?.tierlistRating?.count ?? trap?.rating?.count ?? 0} ratings)</Typography>
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
                  onClick={async () => {
                    if (!trapId) return;
                    const body = newComment.trim();
                    if (!body) return;
                    try {
                      await addComment({ trapId: trapId, body });
                      setNewComment("");
                      setTrap((prev: any) => prev ? ({ ...prev, commentCount: (Number(prev.commentCount || 0) + 1) }) : prev);
                      await loadComments({ reset: true });
                    } catch {}
                  }}
                  sx={{
                    textTransform: 'none',
                    height: 36,
                    px: 1.25,
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
                      <Avatar src={topProfile?.photoURL || undefined} sx={{ width: 28, height: 28 }} />
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" noWrap>
                          {topProfile?.displayName || 'Anonymous'}
                        </Typography>
                        {topProfile?.discordUsername && (
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 18, width: 18 }} />
                            <Typography variant="body1" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700 }} noWrap>
                              {topProfile.discordUsername}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Typography variant="body1" sx={{ opacity: 0.7 }}>{new Date(top.createdAt).toLocaleString()}</Typography>
                    </Stack>
                    <Typography sx={{ mt: 0.75 }}>{renderBody(top.body)}</Typography>
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
                                onClick={async () => {
                                  if (!trapId) return;
                                  const body = (replyDrafts[top.id] || '').trim();
                                  if (!body) return;
                                  try {
                                    await addComment({ trapId: trapId, body, parentId: top.id });
                                    setReplyDrafts((p) => { const n = { ...p }; delete n[top.id]; return n; });
                                    setTrap((prev: any) => prev ? ({ ...prev, commentCount: (Number(prev.commentCount || 0) + 1) }) : prev);
                                    await loadComments({ reset: true });
                                  } catch {}
                                }}
                                sx={{
                                  textTransform: 'none',
                                  height: 32,
                                  px: 1,
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
                                <Avatar src={rProfile?.photoURL || undefined} sx={{ width: 24, height: 24 }} />
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap>
                                    {rProfile?.displayName || 'Anonymous'}
                                  </Typography>
                                  {rProfile?.discordUsername && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                                      <VerifiedUser sx={{ color: currentTheme.palette.brand.main, height: 16, width: 16 }} />
                                      <Typography variant="body2" sx={{ color: currentTheme.palette.brand.main, fontWeight: 700 }} noWrap>
                                        {rProfile.discordUsername}
                                      </Typography>
                                    </Stack>
                                  )}
                                </Stack>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>{new Date(r.createdAt).toLocaleString()}</Typography>
                              </Stack>
                              <Typography sx={{ mt: 0.5 }}>{renderBody(r.body)}</Typography>
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
                                          onClick={async () => {
                                            if (!trapId) return;
                                            const body = (replyDrafts[r.id] || '').trim();
                                            if (!body) return;
                                            try {
                                              await addComment({ trapId: trapId, body, parentId: topId });
                                              setReplyDrafts((p) => { const n = { ...p }; delete n[r.id]; return n; });
                                              await loadComments({ reset: true });
                                            } catch {}
                                          }}
                                          sx={{
                                            textTransform: 'none',
                                            height: 32,
                                            px: 1,
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


