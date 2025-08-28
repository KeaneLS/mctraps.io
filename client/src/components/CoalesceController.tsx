import React from 'react';

declare global {
  interface Window {
    __COALESCE_SETUP__?: () => void;
    __COALESCE_DESTROY__?: () => void;
    __COALESCE_REQUESTED__?: boolean;
    __COALESCE_DESTROY_TIMER__?: number;
    __COALESCE_IS_ACTIVE__?: () => boolean;
    __COALESCE_USER_ENABLED__?: boolean;
  }
}

const CoalesceController: React.FC<{ mode?: 'light' | 'dark'; active?: boolean }> = ({ mode, active = true }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (!active) return;
    const mount = document.body;
    const readUserEnabled = (): boolean => {
      try {
        if (typeof window.__COALESCE_USER_ENABLED__ === 'boolean') return !!window.__COALESCE_USER_ENABLED__;
        const stored = window.localStorage.getItem('particlesEnabled');
        return stored === null ? true : stored === 'true';
      } catch {}
      return true;
    };
    window.__COALESCE_USER_ENABLED__ = readUserEnabled();
    const desiredActive = !!active && !!window.__COALESCE_USER_ENABLED__;
    (window as any).__COALESCE_REQUESTED__ = desiredActive;
    if (typeof window.__COALESCE_DESTROY_TIMER__ === 'number') {
      try { window.clearTimeout(window.__COALESCE_DESTROY_TIMER__); } catch {}
      window.__COALESCE_DESTROY_TIMER__ = undefined;
    }

    const loadScript = (_src: string) => Promise.resolve();

    let cancelled = false;

    let retryInterval: number | undefined;
    let retryDeadline = Date.now() + 4000;

    (async () => {
      try {
        (window as any).__COALESCE_SCRIPTS_LOADED__ = (window as any).__COALESCE_SCRIPTS_LOADED__ || false;
        if (!(window as any).__COALESCE_SCRIPTS_LOADED__) {
          (window as any).__COALESCE_SCRIPTS_LOADED__ = true;
        }
        if ((window as any).__COALESCE_REQUESTED__ && typeof window.__COALESCE_SETUP__ === 'function') {
          window.__COALESCE_SETUP__();
        } else if (!(window as any).__COALESCE_REQUESTED__ && typeof window.__COALESCE_DESTROY__ === 'function') {
          window.__COALESCE_DESTROY__();
        }
        try {
          requestAnimationFrame(() => {
            if ((window as any).__COALESCE_REQUESTED__ && typeof (window as any).__COALESCE_IS_ACTIVE__ === 'function' && !(window as any).__COALESCE_IS_ACTIVE__()) {
              window.__COALESCE_SETUP__ && window.__COALESCE_SETUP__();
            }
            requestAnimationFrame(() => {
              if ((window as any).__COALESCE_REQUESTED__ && typeof (window as any).__COALESCE_IS_ACTIVE__ === 'function' && !(window as any).__COALESCE_IS_ACTIVE__()) {
                window.__COALESCE_SETUP__ && window.__COALESCE_SETUP__();
              }
            });
          });
        } catch {}

        try {
          retryInterval = window.setInterval(() => {
            if (cancelled) { if (retryInterval) { window.clearInterval(retryInterval); retryInterval = undefined; } return; }
            if (!(window as any).__COALESCE_REQUESTED__) { if (retryInterval) { window.clearInterval(retryInterval); retryInterval = undefined; } return; }
            const isActive = typeof (window as any).__COALESCE_IS_ACTIVE__ === 'function' ? (window as any).__COALESCE_IS_ACTIVE__() : false;
            if (typeof window.__COALESCE_SETUP__ === 'function' && !isActive) {
              try { window.__COALESCE_SETUP__(); } catch {}
            }
            if (Date.now() > retryDeadline || (typeof (window as any).__COALESCE_IS_ACTIVE__ === 'function' && (window as any).__COALESCE_IS_ACTIVE__())) {
              if (retryInterval) { window.clearInterval(retryInterval); retryInterval = undefined; }
            }
          }, 100);
        } catch {}
      } catch {}
    })();

    const onToggle = () => {
      const userEnabled = readUserEnabled();
      window.__COALESCE_USER_ENABLED__ = userEnabled;
      const want = !!active && userEnabled;
      (window as any).__COALESCE_REQUESTED__ = want;
      if (want) {
        if (typeof window.__COALESCE_SETUP__ === 'function') window.__COALESCE_SETUP__();
      } else {
        if (typeof window.__COALESCE_DESTROY__ === 'function') window.__COALESCE_DESTROY__();
      }
    };
    window.addEventListener('COALESCE_ENABLED_CHANGED', onToggle as any);

    return () => {
      cancelled = true;
      try { if (retryInterval) { window.clearInterval(retryInterval); retryInterval = undefined; } } catch {}
      (window as any).__COALESCE_REQUESTED__ = false;
      window.removeEventListener('COALESCE_ENABLED_CHANGED', onToggle as any);
      try {
        window.__COALESCE_DESTROY_TIMER__ = window.setTimeout(() => {
          if (!(window as any).__COALESCE_REQUESTED__) {
            window.__COALESCE_DESTROY__ && window.__COALESCE_DESTROY__();
          }
        }, 1500);
      } catch {}
    };
  }, [active]);

  React.useEffect(() => {
    if (mode === 'light' || mode === 'dark') {
      (window as any).__COALESCE_MODE__ = mode;
      if (typeof (window as any).__COALESCE_FORCE_RECOLOR__ === 'function') {
        (window as any).__COALESCE_FORCE_RECOLOR__();
      }
    }
  }, [mode]);

  return null;
};

export default CoalesceController;


