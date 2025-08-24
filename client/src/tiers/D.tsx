import React from 'react';
import TierBadge from './TierBadge';

const D: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="D" hexBg="BFFF7F" size={size} />
);

export default D;


