import { useMemo } from 'react'

import { CssBaseline, StyledEngineProvider } from '@mui/material'
import {
  createTheme,
  ThemeProvider
} from '@mui/material/styles'
import { esES as coreEsES } from '@mui/material/locale'
import { esES } from '@mui/x-date-pickers'

import Palette from './palette'
import Typography from './typography'
import CustomShadows from './shadows'
import componentsOverride from './overrides'
import { Theme } from '@emotion/react'

// ==============================|| DEFAULT THEME - MAIN  ||============================== //

export default function ThemeCustomization ({ children }: { children: JSX.Element }) {
  const theme = Palette('light')

  const themeTypography = Typography('\'Public Sans\', sans-serif')
  const themeCustomShadows = useMemo(() => CustomShadows(theme), [theme])

  const themeOptions: any = useMemo(
    () => ({
      breakpoints: {
        values: {
          xs: 0,
          sm: 768,
          md: 1024,
          lg: 1266,
          xl: 1536
        }
      },
      direction: 'ltr',
      mixins: {
        toolbar: {
          minHeight: 60,
          paddingTop: 8,
          paddingBottom: 8
        }
      },
      palette: theme.palette,
      customShadows: themeCustomShadows,
      typography: themeTypography
    }),
    [theme, themeTypography, themeCustomShadows]
  )

  const themes = createTheme(themeOptions, esES, coreEsES)
  themes.components = componentsOverride(themes as Theme)

  return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={themes}>
                <CssBaseline/>
                {children}
            </ThemeProvider>
        </StyledEngineProvider>
  )
}
