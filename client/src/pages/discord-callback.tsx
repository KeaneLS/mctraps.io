import React from 'react';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { functions, auth } from '../firebase/config';
import { ensureAnonymousUser } from '../firebase/authentication';

const DiscordCallback: React.FC = () => {
  const hasRunRef = React.useRef(false);
  React.useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const rawState = params.get('state') || '';
      const stateParts = rawState.split(':');
      const mode = stateParts[0] === 'verify' ? 'verify' : 'auth';
      const authAction = mode === 'auth' ? (stateParts[1] === 'signup' ? 'signup' : 'login') : null;
      const state = stateParts.length > 1 ? stateParts.slice(1).join(':') : rawState;

      if (!code) {
        try {
          const payload = { type: 'discord-auth-error', error: 'Missing code' };
          try { window.opener && window.opener.postMessage(payload, '*'); } catch {}
        } catch {}
        try { window.close(); } catch {}
        return;
      }

      const processedKey = `discord_code_processed:${code}`;
      try {
        if (sessionStorage.getItem(processedKey)) {
          return;
        }
        sessionStorage.setItem(processedKey, '1');
      } catch {}

      const expectedState = (() => {
        try { return window.localStorage.getItem('discord_oauth_state') || ''; } catch { return ''; }
      })();
      if (!state || !expectedState) {
        const payload = { type: 'discord-auth-error', error: 'State missing' };
        try { window.opener && window.opener.postMessage(payload, window.location.origin); } catch {}
        return;
      }
      if (rawState !== expectedState) {
        const payload = { type: 'discord-auth-error', error: 'State mismatch' };
        try { window.opener && window.opener.postMessage(payload, window.location.origin); } catch {}
        return;
      }
      const codeVerifier = (() => {
        try { return window.localStorage.getItem('discord_code_verifier') || ''; } catch { return ''; }
      })();
      try { window.localStorage.removeItem('discord_oauth_state'); } catch {}
      try { window.localStorage.removeItem('discord_code_verifier'); } catch {}

      try {
        try { await ensureAnonymousUser(); } catch {}
        const redirectUri = `${window.location.origin}/auth/discord/callback`;
        const exchange = httpsCallable(functions, 'exchangeDiscordCode');
        const res: any = await exchange({ code, redirectUri, codeVerifier, mode });
        const customToken = res?.data?.customToken as string | undefined;
        const profile = res?.data?.profile as { displayName?: string | null; email?: string | null; photoURL?: string | null; discordUsername?: string | null } | undefined;

        if (mode === 'auth') {
          if (customToken) {
            await signInWithCustomToken(auth, customToken);
            try { await auth.currentUser?.reload(); } catch {}
            try {
              const { getIdToken } = await import('firebase/auth');
              if (auth.currentUser) {
                await getIdToken(auth.currentUser, true);
              }
            } catch {}
          }
          try {
            const user = auth.currentUser;
            if (user && (profile?.displayName || profile?.photoURL)) {
              const { updateProfile } = await import('firebase/auth');
              const updates: { displayName?: string; photoURL?: string } = {};
              if (!user.displayName && profile?.displayName) {
                updates.displayName = profile.displayName;
              }
              if (!user.photoURL && profile?.photoURL) {
                updates.photoURL = profile.photoURL;
              }
              if (updates.displayName || updates.photoURL) {
                await updateProfile(user, updates);
                try { await user.reload(); } catch {}
              }
            }
          } catch {}
          try {
            const verify = httpsCallable(functions, 'verifyDiscord');
            await verify({
              displayName: profile?.displayName ?? null,
              email: profile?.email ?? null,
              photoURL: profile?.photoURL ?? null,
              discordUsername: profile?.discordUsername ?? profile?.displayName ?? null,
            });
          } catch {}
        }

        try {
          const cleanUrl = `${window.location.origin}/auth/discord/callback`;
          window.history.replaceState({}, '', cleanUrl);
        } catch {}

        const payload = { type: 'discord-auth-complete', code, state: rawState, profile };
        try { window.opener && window.opener.postMessage(payload, window.location.origin); } catch {}
        if (mode === 'verify') {
          try {
            window.location.replace('https://discord.gg/jNanZrV4xj');
            return;
          } catch {}
        }
        setTimeout(() => { try { window.close(); } catch {} }, 300);
      } catch (err: any) {
        try { sessionStorage.removeItem(processedKey); } catch {}
        try {
          const message = err?.message || 'Discord authentication failed';
          const payload = { type: 'discord-auth-error', error: message };
          try { window.opener && window.opener.postMessage(payload, window.location.origin); } catch {}
          try { console.error('Discord auth error:', err); } catch {}
        } catch {}
      }
      setTimeout(() => { try { window.close(); } catch {} }, 100);
    })();
  }, []);

  return null;
};

export default DiscordCallback;


