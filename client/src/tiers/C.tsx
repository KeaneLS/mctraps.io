import React from 'react';
import TierBadge from './TierBadge';

const C: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="C" hexBg="FFFF7F" size={size} />
);

export default C;


