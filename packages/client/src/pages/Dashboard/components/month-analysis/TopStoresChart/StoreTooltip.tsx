import { Box, Typography } from '@mui/material'
import { format } from 'utils'

const StoreTooltip = ({ active, payload }: any) => {
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
      <Typography variant='body2' fontWeight={600}>{entry.payload.name}</Typography>
      <Typography variant='body1' fontWeight={700} color='primary'>
        {format.euro(Number(entry.value))}
      </Typography>
    </Box>
  )
}

export default StoreTooltip
