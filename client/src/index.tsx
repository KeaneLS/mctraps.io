import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './pages/landing';
import { TierBadge, A, B, C, D, E, F, S } from './tiers';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Landing />
    <A />
    <B />
    <C />
    <D />
    <E />
    <F />
    <S />

  </React.StrictMode>
);