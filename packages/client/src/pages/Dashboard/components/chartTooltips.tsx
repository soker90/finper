import React from 'react'
import { Stack, Box, Typography } from '@mui/material'
import { format } from 'utils'

export const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
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
      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>{label}</Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction='row' justifyContent='space-between' spacing={2} sx={{ mt: 0.25 }}>
          <Stack direction='row' alignItems='center' gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
            <Typography variant='body2' color='textSecondary'>{entry.name}</Typography>
          </Stack>
          <Typography variant='body2' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
        </Stack>
      ))}
    </Box>
  )
}

export const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        minWidth: 120
      }}
    >
      <Stack direction='row' alignItems='center' gap={0.75} sx={{ mb: 0.25 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.payload.fill }} />
        <Typography variant='body2' fontWeight={600}>{entry.name}</Typography>
      </Stack>
      <Typography variant='body1' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
    </Box>
  )
}

export const VelocityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
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
      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>Día {label}</Typography>
      {payload.map((entry: any) => (
        <Stack key={entry.name} direction='row' justifyContent='space-between' spacing={2} sx={{ mt: 0.25 }}>
          <Stack direction='row' alignItems='center' gap={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
            <Typography variant='body2' color='textSecondary'>{entry.name}</Typography>
          </Stack>
          <Typography variant='body2' fontWeight={600}>{format.euro(Number(entry.value))}</Typography>
        </Stack>
      ))}
    </Box>
  )
}
