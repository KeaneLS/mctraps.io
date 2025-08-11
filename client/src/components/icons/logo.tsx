import React from 'react';
import { motion, MotionProps, useAnimationControls } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

export type LogoProps = MotionProps & React.HTMLAttributes<HTMLDivElement> & {
  armHeadSrc?: string;
  baseSrc?: string;
  gapSrc?: string;
  width?: number | string;
  height?: number | string;
  alt?: string;
  'aria-label'?: string;
  retractOffset?: number;
  retractDuration?: number;
};

const Logo: React.FC<LogoProps> = ({
  armHeadSrc,
  baseSrc,
  gapSrc,
  alt = 'MCTraps logo',
  width = 256,
  height = 256,
  style,
  retractOffset = 77,
  retractDuration = 0.5,
  ...motionProps
}) => {
  const baseUrl = process.env.PUBLIC_URL ?? '';
  const defaultArmHead = armHeadSrc ?? `${baseUrl}/logo/armhead.png`;
  const defaultBase = baseSrc ?? `${baseUrl}/logo/base.png`;
  const defaultGap = gapSrc ?? `${baseUrl}/logo/gapspace.png`;
  const fallbackSrc = `${baseUrl}/mctraps_favicon.svg`;
  const [currentArmHead, setCurrentArmHead] = React.useState<string>(defaultArmHead);
  const [currentBase, setCurrentBase] = React.useState<string>(defaultBase);
  const [currentGap, setCurrentGap] = React.useState<string>(defaultGap);
  const controls = useAnimationControls();
  const isAnimatingRef = React.useRef<boolean>(false);
  const theme = useTheme();
  const gapColor = theme.palette.background.default;

  const {
    animate: containerAnimate,
    onHoverStart: userOnHoverStart,
    onHoverEnd: userOnHoverEnd,
    ...restMotionProps
  } = motionProps;

  const handleHoverStart = async (event: unknown, info: unknown) => {
    if (isAnimatingRef.current) {
      if (typeof userOnHoverStart === 'function') userOnHoverStart(event as any, info as any);
      return;
    }
    isAnimatingRef.current = true;
    controls.stop();
    controls.set({ y: 0 });
    await controls.start({
      y: [0, Math.abs(retractOffset), 0],
      transition: {
        duration: retractDuration,
        times: [0, 0.5, 1],
        ease: 'easeOut',
      },
    });
    isAnimatingRef.current = false;
    if (typeof userOnHoverStart === 'function') userOnHoverStart(event as any, info as any);
  };

  const handleHoverEnd = (event: unknown, info: unknown) => {
    if (typeof userOnHoverEnd === 'function') userOnHoverEnd(event as any, info as any);
  };

  return (
    <motion.div
      style={{
        position: 'relative',
        width,
        height,
        display: 'inline-block',
        overflow: 'hidden',
        ...style,
      }}
      initial={containerAnimate as any}
      animate={containerAnimate as any}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      {...restMotionProps}
    >
      <motion.img
        src={currentArmHead}
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="eager"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          willChange: 'transform',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        initial={{ y: 0 }}
        animate={controls}
        onError={() => {
          if (currentArmHead !== fallbackSrc) setCurrentArmHead(fallbackSrc);
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: gapColor,
          WebkitMaskImage: `url(${currentGap})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: `url(${currentGap})`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <img
        src={currentBase}
        alt={alt}
        aria-label={alt}
        draggable={false}
        loading="eager"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 3,
        }}
        onError={() => {
          if (currentBase !== fallbackSrc) setCurrentBase(fallbackSrc);
        }}
      />
    </motion.div>
  );
};

export default Logo;


