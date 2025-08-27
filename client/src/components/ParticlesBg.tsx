import React from 'react';
import 'particles.js';
import { useTheme } from '@mui/material/styles';

declare global {
  interface Window {
    particlesJS: any;
    pJSDom?: any[];
  }
}

export interface ParticlesBgProps {
  mode?: 'light' | 'dark';
}

const ParticlesBg: React.FC<ParticlesBgProps> = ({ mode }) => {
  const theme = useTheme();
  const effectiveMode = mode || ((theme as any)?.palette?.mode as 'light' | 'dark' | undefined);
  const lightColor = (theme as any)?.palette?.light?.main || '#ffffff';
  const darkColor = (theme as any)?.palette?.dark?.main || '#111111';
  const textPrimary = (theme as any)?.palette?.text?.primary as string | undefined;
  const particleColor = textPrimary || (effectiveMode === 'dark' ? lightColor : darkColor);

  React.useEffect(() => {
    try {
      const anyWin = window as any;
      if (anyWin.pJSDom && Array.isArray(anyWin.pJSDom)) {
        anyWin.pJSDom.forEach((inst: any) => inst?.pJS?.fn?.vendors?.destroy?.());
        anyWin.pJSDom.length = 0;
      }
    } catch {}

    const cfg = {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 1400 } },
        color: { value: particleColor },
        shape: {
          type: 'circle',
          stroke: { width: 0, color: '#000000' },
          polygon: { nb_sides: 5 },
          image: { src: 'img/github.svg', width: 100, height: 100 },
        },
        opacity: {
          value: 0.5,
          random: false,
          anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false },
        },
        size: {
          value: 3,
          random: true,
          anim: { enable: false, speed: 40, size_min: 0.1, sync: false },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: particleColor,
          opacity: 0.4,
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
          attract: { enable: false, rotateX: 600, rotateY: 1200 },
        },
        links: {
          enable: true,
          distance: 150,
          color: particleColor,
          opacity: 0.4,
          width: 1,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: true, mode: 'repulse' },
          onclick: { enable: false, mode: 'push' },
          resize: true,
        },
        modes: {
          grab: { distance: 400, line_linked: { opacity: 1 } },
          bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
          repulse: { distance: 200, duration: 0.4 },
          push: { particles_nb: 4 },
          remove: { particles_nb: 2 },
        },
      },
      retina_detect: true,
    } as any;

    try {
      if (window && window.particlesJS) {
        window.particlesJS('particles-layer', cfg);
      }
    } catch {}

    return () => {
      try {
        const anyWin = window as any;
        if (anyWin.pJSDom && Array.isArray(anyWin.pJSDom)) {
          anyWin.pJSDom.forEach((inst: any) => inst?.pJS?.fn?.vendors?.destroy?.());
          anyWin.pJSDom.length = 0;
        }
      } catch {}
      const container = document.getElementById('particles-layer');
      if (container) {
        while (container.firstChild) container.removeChild(container.firstChild);
      }
    };
  }, [particleColor]);

  return (
    <div
      id="particles-layer"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden
    />
  );
};

export default ParticlesBg;


