import {
  Theme as MaterialUITheme, Palette as MaterialPalette, Color as MaterialColor, PaletteColor as MaterialPaletteColor
} from '@mui/material'

import {
  Theme as EmotionTheme
} from '@emotion/react'

declare module '@emotion/react' {
    interface PaletteColor extends MaterialPaletteColor {
        darker: string
    }

    interface Color extends MaterialColor {
        A800: string
    }

    interface Palette extends MaterialPalette {
        grey: Color
        primary: PaletteColor
    }

    export interface Theme extends MaterialUITheme, EmotionTheme {
        customShadows: {
            z1: string
        }
        palette: Palette
    }
}
