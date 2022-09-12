import { Theme } from '@emotion/react'

export default function ListItemIcon (theme: Theme) {
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 24,
          color: theme.palette.text.primary
        }
      }
    }
  }
}
