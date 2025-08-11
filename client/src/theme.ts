import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    brand: Palette['primary'];
    light: Palette['primary'];
    dark: Palette['primary'];
  }
  interface PaletteOptions {
    brand?: PaletteOptions['primary'];
    light?: PaletteOptions['primary'];
    dark?: PaletteOptions['primary'];
  }
}

const colors = {
  brand: '#38bdf8',
  light: '#fafafa', // light surface
  dark: '#18181b',   // dark surface
};

export type AppThemeMode = 'light' | 'dark';

export const createAppTheme = (mode: AppThemeMode = 'dark') => {
  const isLight = mode === 'light';
  const backgroundDefault = isLight ? colors.light : colors.dark;
  const backgroundPaper = backgroundDefault;
  const textPrimary = isLight ? colors.dark : colors.light;
  // Swap the meaning of custom light/dark swatches when in light mode
  const paletteLightMain = isLight ? colors.dark : colors.light;
  const paletteDarkMain = isLight ? colors.light : colors.dark;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: colors.brand,
      },
      secondary: {
        main: colors.light,
        contrastText: colors.dark,
      },
      background: {
        default: backgroundDefault,
        paper: backgroundPaper,
      },
      text: {
        primary: textPrimary,
        secondary: colors.brand,
      },
      brand: {
        main: colors.brand,
        contrastText: colors.dark,
      },
      light: {
        main: paletteLightMain,
        contrastText: colors.dark,
      },
      dark: {
        main: paletteDarkMain,
        contrastText: colors.light,
      },
    },
  typography: {
    fontFamily: 'Lato, sans-serif',
    htmlFontSize: 16,

    // Headings
    h1: {
      fontSize: '49px',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    h2: {
      fontSize: '39px',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      fontWeight: 700,
    },
    h3: {
      fontSize: '31px',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
      fontWeight: 700,
    },
    h4: {
      fontSize: '25px',
      lineHeight: 1.3,
      letterSpacing: '-0.015em',
      fontWeight: 600,
    },
    h5: {
      fontSize: '20px',
      lineHeight: 1.5,
      letterSpacing: '-0.005em',
      fontWeight: 600,
    },
    h6: {
      fontSize: '18px',
      lineHeight: 1.5,
      letterSpacing: '0em',
      fontWeight: 600,
    },

    // Body
    body1: {
      fontSize: '16px',
      lineHeight: 1.5,
      letterSpacing: '0.005em',
    },
    // Using body2 as a slightly smaller body text if needed
    body2: {
      fontSize: '14px',
      lineHeight: 1.6,
      letterSpacing: '0.005em',
    },

    // Caption
    caption: {
      fontSize: '14px',
      lineHeight: 1.6,
      letterSpacing: '0.005em',
    },
  },
    components: {
    MuiCssBaseline: {
      styleOverrides: (themeParam) => ({
        body: {
          backgroundColor: themeParam.palette.background.default,
          color: themeParam.palette.text.primary,
        },
        '.h1': themeParam.typography.h1,
        '.h2': themeParam.typography.h2,
        '.h3': themeParam.typography.h3,
        '.h4': themeParam.typography.h4,
        '.h5': themeParam.typography.h5,
        '.h6': themeParam.typography.h6,
        '.body-lg': {
          fontSize: '17px',
          lineHeight: 1.5,
          letterSpacing: '0.005em',
        },
        '.body': themeParam.typography.body1,
        '.link': {
          fontSize: '15px',
          lineHeight: 1.5,
          letterSpacing: '0.005em',
          color: colors.brand,
          textDecoration: 'none',
        },
        '.caption': themeParam.typography.caption,
      }),
    },
    // Link text style
    MuiLink: {
      styleOverrides: {
        root: {
          fontSize: '15px',
          lineHeight: 1.5,
          letterSpacing: '0.005em',
        },
      },
    },
    },
  });
};

// Prebuilt themes for convenience
export const darkTheme = createAppTheme('dark');
export const lightTheme = createAppTheme('light');

const theme = darkTheme;
export default theme;


