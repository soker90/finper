import { Theme } from '@mui/material'

export default function IconButton (theme: Theme) {
  return {
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          '&.MuiIconButton-sizeLarge': {
            width: theme.spacing(5.5),
            height: theme.spacing(5.5),
            fontSize: '1.25rem'
          },
          '&.MuiIconButton-sizeMedium': {
            width: theme.spacing(4.5),
            height: theme.spacing(4.5),
            fontSize: '1rem'
          },
          '&.MuiIconButton-sizeSmall': {
            width: theme.spacing(3.75),
            height: theme.spacing(3.75),
            fontSize: '0.75rem'
          }
        }
      }
    }
  }
}
