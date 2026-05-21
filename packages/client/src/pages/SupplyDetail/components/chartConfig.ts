import type { Theme } from '@mui/material/styles'

export const getElectricityColors = (theme: Theme) => ({
  peak: theme.palette.error.main,
  flat: theme.palette.warning.main,
  offPeak: theme.palette.success.main,
})

export const ELECTRICITY_LABELS: Record<'peak' | 'flat' | 'offPeak', string> = {
  peak: 'Punta',
  flat: 'Llano',
  offPeak: 'Valle',
}

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3' as const,
  vertical: false,
}

export const CHART_AXIS_PROPS = {
  tick: { fontSize: 12 },
  axisLine: false,
  tickLine: false,
}
