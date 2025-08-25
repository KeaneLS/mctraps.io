import React from 'react';
import { motion, MotionProps, useAnimationControls } from 'framer-motion';
import { useTheme, Theme } from '@mui/material/styles';

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
  // When this number changes, the retract animation will be triggered
  triggerKey?: number;
  // Optional theme override. If provided, overrides the MUI context theme
  theme?: Theme;
};

export type LogoHandle = {
  retract: () => Promise<void>;
};

const Logo = React.forwardRef<LogoHandle, LogoProps>(({ 
  armHeadSrc,
  baseSrc,
  gapSrc,
  alt = 'MCTraps logo',
  width = 256,
  height = 256,
  style,
  retractOffset = 77,
  retractDuration = 0.5,
  triggerKey,
  theme: providedTheme,
  ...motionProps
}, ref) => {
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
  const themeFromContext = useTheme();
  const effectiveTheme = providedTheme ?? themeFromContext;
  const armBaseColor = effectiveTheme.palette.light.main;
  const gapColor = effectiveTheme.palette.dark.main;

  const {
    animate: containerAnimate,
    onHoverStart: userOnHoverStart,
    onHoverEnd: userOnHoverEnd,
    ...restMotionProps
  } = motionProps;

  const playRetract = async () => {
    if (isAnimatingRef.current) {
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
  };

  const handleHoverStart = async (event: unknown, info: unknown) => {
    await playRetract();
    if (typeof userOnHoverStart === 'function') userOnHoverStart(event as any, info as any);
  };

  const handleHoverEnd = (event: unknown, info: unknown) => {
    if (typeof userOnHoverEnd === 'function') userOnHoverEnd(event as any, info as any);
  };

  React.useEffect(() => {
    if (typeof triggerKey !== 'number') return;
    playRetract();
  }, [triggerKey]);

  React.useImperativeHandle(ref, () => ({
    retract: playRetract,
  }));

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
      role="img"
      aria-label={alt}
      {...restMotionProps}
    >
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: armBaseColor,
          WebkitMaskImage: `url(${currentArmHead})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: `url(${currentArmHead})`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          willChange: 'transform',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        initial={{ y: 0 }}
        animate={controls}
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

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: armBaseColor,
          WebkitMaskImage: `url(${currentBase})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: `url(${currentBase})`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </motion.div>
  );
});

export default Logo;


