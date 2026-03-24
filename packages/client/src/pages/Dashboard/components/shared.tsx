import { useTheme } from '@mui/material/styles'

export const hoverCardSx = {
  transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
  }
}

export const useChartColors = () => {
  const theme = useTheme()
  return [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
    theme.palette.primary.dark
  ]
}
