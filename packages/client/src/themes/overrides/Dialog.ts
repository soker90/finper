import { alpha } from '@mui/material/styles'

export default function Dialog () {
  return {
    MuiDialog: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backgroundColor: alpha('#000', 0.7)
          }
        }
      }
    }
  }
}
