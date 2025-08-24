import React from 'react';
import TierBadge from './TierBadge';

const F: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="F" hexBg="7FFFFF" size={size} />
);

export default F;


