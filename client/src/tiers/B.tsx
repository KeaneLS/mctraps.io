import React from 'react';
import TierBadge from './TierBadge';

const B: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="B" hexBg="FFDF7F" size={size} />
);

export default B;


