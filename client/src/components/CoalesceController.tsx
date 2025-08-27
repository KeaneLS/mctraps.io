import React from 'react';

declare global {
  interface Window {
    __COALESCE_SETUP__?: () => void;
    __COALESCE_DESTROY__?: () => void;
  }
}

const CoalesceController: React.FC<{ mode?: 'light' | 'dark' }> = ({ mode }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const mount = document.getElementById('coalesce-root');
    if (!mount) return;
    const container = document.createElement('div');
    container.className = 'content content--canvas';
    container.setAttribute('aria-hidden', 'true');
    (container.style as any).pointerEvents = 'none';
    (container.style as any).zIndex = '0';
    mount.appendChild(container);

    const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
      const existing = Array.from(document.getElementsByTagName('script')).some(s => s.src && s.src.indexOf(src) !== -1);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.body.appendChild(s);
    });

    let cancelled = false;

    (async () => {
      try {
        (window as any).__COALESCE_SCRIPTS_LOADED__ = (window as any).__COALESCE_SCRIPTS_LOADED__ || false;
        if (!(window as any).__COALESCE_SCRIPTS_LOADED__) {
          const base = (process.env && (process.env as any).PUBLIC_URL) || '';
          await loadScript(base + '/ambient/noise.min.js');
          await loadScript(base + '/ambient/util.js');
          await loadScript(base + '/ambient/coalesce.js');
          (window as any).__COALESCE_SCRIPTS_LOADED__ = true;
        }
        if (!cancelled) {
          window.__COALESCE_SETUP__ && window.__COALESCE_SETUP__();
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
      window.__COALESCE_DESTROY__ && window.__COALESCE_DESTROY__();
      try { mount.removeChild(container); } catch {}
    };
  }, []);

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


