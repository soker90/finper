import {
  Theme as MaterialUITheme, Palette as MaterialPalette, Color as MaterialColor, PaletteColor as MaterialPaletteColor
} from '@mui/material'

declare module '@emotion/react' {
  interface PaletteColor extends MaterialPaletteColor {
    darker: string
    lighter: string
  }

  interface Color extends MaterialColor {
    A800: string
  }

  interface Palette extends MaterialPalette {
    grey: Color
    primary: PaletteColor
    error: PaletteColor
    secondary: PaletteColor
    warning: PaletteColor
    info: PaletteColor
    success: PaletteColor
  }

  export interface Theme extends MaterialUITheme {
    customShadows: {
      z1: string
    }
    palette: Palette
  }
}

declare module '@mui/material/styles' {
  interface PaletteColor {
    darker: string
    lighter: string
  }

  interface Color {
    A800: string
  }

  // eslint-disable-next-line no-unused-vars
  interface Palette {
    grey: Color
    primary: PaletteColor
    error: PaletteColor
    secondary: PaletteColor
    warning: PaletteColor
    info: PaletteColor
    success: PaletteColor
  }

  // eslint-disable-next-line no-unused-vars
  interface Theme {
    customShadows: {
      z1: string
    }
  }
}
