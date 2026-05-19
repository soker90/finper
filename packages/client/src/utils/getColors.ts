import { type Theme, type PaletteColor } from '@mui/material/styles'

type ExtendedPaletteColor = PaletteColor & { lighter: string; darker: string }

const getColors = (theme: Theme, color: string): ExtendedPaletteColor => {
  switch (color) {
    case 'secondary':
      return theme.palette.secondary as unknown as ExtendedPaletteColor
    case 'error':
      return theme.palette.error as unknown as ExtendedPaletteColor
    case 'warning':
      return theme.palette.warning as unknown as ExtendedPaletteColor
    case 'info':
      return theme.palette.info as unknown as ExtendedPaletteColor
    case 'success':
      return theme.palette.success as unknown as ExtendedPaletteColor
    default:
      return theme.palette.primary as unknown as ExtendedPaletteColor
  }
}

export default getColors
