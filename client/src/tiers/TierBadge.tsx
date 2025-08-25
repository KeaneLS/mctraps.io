import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TierBadgeProps {
  label: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  hexBg: string;
  size?: number;
}

const TierBadge: React.FC<TierBadgeProps> = ({ label, hexBg, size = 28 }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        bgcolor: `#${hexBg}`,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0,0,0,0.2)'
      }}
      aria-label={`Tier ${label}`}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#18181b',
          fontWeight: 700,
          lineHeight: 1,
          textAlign: 'center',
          display: 'inline-block'
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default TierBadge;


