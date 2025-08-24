import React from 'react';
import { Box, Typography } from '@mui/material';

export interface TierBadgeProps {
  label: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  /** Hex color without the leading #, e.g., FF7F7F */
  hexBg: string;
  /** Size in pixels. Default 28. */
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


