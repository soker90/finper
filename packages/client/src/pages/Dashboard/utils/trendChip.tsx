import { Chip } from '@mui/material'
import { RiseOutlined, FallOutlined } from '@ant-design/icons'

export const trendChip = (current: number, previous: number, invertPositive = false) => {
  if (!previous) return null
  const pct = ((current - previous) / previous) * 100
  const isUp = pct >= 0
  const isPositive = invertPositive ? !isUp : isUp
  return (
    <Chip
      size='small'
      icon={isUp ? <RiseOutlined style={{ fontSize: '0.75rem' }} /> : <FallOutlined style={{ fontSize: '0.75rem' }} />}
      label={`${Math.abs(pct).toFixed(1)}%`}
      color={isPositive ? 'success' : 'error'}
      sx={{ ml: 1, height: 22, fontSize: '0.75rem' }}
    />
  )
}
