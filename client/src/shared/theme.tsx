import { createTheme } from '@mui/material/styles';

export const defaultTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 320,
      md: 750,
      lg: 1025,
      xl: 1280,
    },
  },
  palette: {
    primary: {
      main: 'rgb(99, 102, 241)',
      dark: '#008AC0',
    },
    grey: {
      A100: '#fcfcfc',
      A200: '#fff',
    },
    text: {
      primary: '#11142D',
      secondary: '#808191',
    },
  },
});
