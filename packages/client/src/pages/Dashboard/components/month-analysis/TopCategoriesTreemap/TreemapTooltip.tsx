import { Box, Typography } from '@mui/material'
import { format } from 'utils'

interface TreemapTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name: string
      parentName?: string
      amount?: number
      value: number
    }
  }>
}

const TreemapTooltip = ({ active, payload }: TreemapTooltipProps) => {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload
  if (!item || item.name === 'Total') return null

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 140
      }}
    >
      {item.parentName && (
        <Typography variant='caption' color='textSecondary' display='block'>
          {item.parentName}
        </Typography>
      )}
      <Typography variant='body2' fontWeight={600}>{item.name}</Typography>
      <Typography variant='body1' fontWeight={700} color='primary'>
        {format.euro(Number(item.amount ?? item.value))}
      </Typography>
    </Box>
  )
}

export default TreemapTooltip
