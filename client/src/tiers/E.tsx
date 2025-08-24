import React from 'react';
import TierBadge from './TierBadge';

const E: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="E" hexBg="7FFF7F" size={size} />
);

export default E;


