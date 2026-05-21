import { type Theme } from '@mui/material/styles'

import getColors from 'utils/getColors'
import getShadow from 'utils/getShadow'

function getColor ({ variant, theme }: { variant: string, theme: Theme }) {
  const colors = getColors(theme, variant)
  const { light } = colors

  const shadows = getShadow(theme, `${variant}`)

  return {
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: light
    },
    '&.Mui-focused': {
      boxShadow: shadows,
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${light}`
      }
    }
  }
}

export default function OutlinedInput (theme: Theme) {
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: '10.5px 14px 10.5px 12px'
        },
        notchedOutline: {
          borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[200] : theme.palette.grey[300]
        },
        root: {
          ...getColor({ variant: 'primary', theme }),
          '&.Mui-error': {
            ...getColor({ variant: 'error', theme })
          },
          '&.MuiOutlinedInput-colorSecondary': getColor({ variant: 'secondary', theme }),
          '&.MuiOutlinedInput-colorError': getColor({ variant: 'error', theme }),
          '&.MuiOutlinedInput-colorWarning': getColor({ variant: 'warning', theme }),
          '&.MuiOutlinedInput-colorInfo': getColor({ variant: 'info', theme }),
          '&.MuiOutlinedInput-colorSuccess': getColor({ variant: 'success', theme })
        },
        inputSizeSmall: {
          padding: '7.5px 8px 7.5px 12px'
        },
        inputMultiline: {
          padding: 0
        }
      }
    }
  }
}
