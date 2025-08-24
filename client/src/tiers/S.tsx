import React from 'react';
import TierBadge from './TierBadge';

const S: React.FC<{ size?: number }> = ({ size }) => (
  <TierBadge label="S" hexBg="FF7F7F" size={size} />
);

export default S;


