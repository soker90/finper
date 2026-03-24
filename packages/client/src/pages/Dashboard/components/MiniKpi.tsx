import { type ReactNode } from 'react'
import { Stack, Box, Typography, Avatar } from '@mui/material'

interface MiniKpiProps {
  title: string
  value: string
  icon: ReactNode
  color?: string
}

const MiniKpi = ({ title, value, icon, color = 'primary' }: MiniKpiProps) => (
  <Stack direction='row' alignItems='center' spacing={1.5} sx={{ py: 1 }}>
    <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, width: 32, height: 32 }}>
      {icon}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant='body2' color='textSecondary' noWrap>{title}</Typography>
      <Typography variant='subtitle1'>{value}</Typography>
    </Box>
  </Stack>
)

export default MiniKpi
