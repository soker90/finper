import { Box, Typography } from '@mui/material'
import { format } from 'utils'

interface StoreTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      name: string
    }
  }>
}

const StoreTooltip = ({ active, payload }: StoreTooltipProps) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]

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
      <Typography
        variant='body2' sx={{
          fontWeight: 600
        }}
      >{entry.payload.name}
      </Typography>
      <Typography
        variant='body1' color='primary' sx={{
          fontWeight: 700
        }}
      >
        {format.euro(Number(entry.value))}
      </Typography>
    </Box>
  )
}

export default StoreTooltip
