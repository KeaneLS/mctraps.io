import React from 'react';
import TierBadge from './TierBadge';

const A: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="A" hexBg="FFBF7F" size={size} />
);

export default A;


