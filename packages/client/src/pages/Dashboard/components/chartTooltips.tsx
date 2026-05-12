import { Stack, Box, Typography } from '@mui/material'
import { format } from 'utils'
import { ColorDot } from './shared'

const tooltipBoxSx = (minWidth = 140) => ({
  bgcolor: 'background.paper',
  p: 1.5,
  borderRadius: 2,
  boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  minWidth
})

export const ChartTooltip = ({
  active,
  payload,
  label,
  labelPrefix = ''
}: {
  active?: boolean
  payload?: any[]
  label?: any
  labelPrefix?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={tooltipBoxSx()}>
      <Typography variant='subtitle2' sx={{ mb: 0.5 }}>{labelPrefix}{label}</Typography>
      {payload.map((entry: any) => (
        <Stack
          key={entry.name}
          direction='row'
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            mt: 0.25
          }}
        >
          <Stack
            direction='row'
            sx={{
              alignItems: 'center',
              gap: 0.75
            }}
          >
            <ColorDot color={entry.color} />
            <Typography variant='body2' color='textSecondary'>{entry.name}</Typography>
          </Stack>
          <Typography
            variant='body2' sx={{
              fontWeight: 600
            }}
          >{format.euro(Number(entry.value))}
          </Typography>
        </Stack>
      ))}
    </Box>
  )
}

export const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <Box sx={tooltipBoxSx(120)}>
      <Stack
        direction='row'
        sx={{
          alignItems: 'center',
          gap: 0.75,
          mb: 0.25
        }}
      >
        <ColorDot color={entry.payload.fill} />
        <Typography
          variant='body2' sx={{
            fontWeight: 600
          }}
        >{entry.name}
        </Typography>
      </Stack>
      <Typography
        variant='body1' sx={{
          fontWeight: 600
        }}
      >{format.euro(Number(entry.value))}
      </Typography>
    </Box>
  )
}

export const PensionSparklineTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <Box sx={tooltipBoxSx(0)}>
      <Typography variant='caption' color='textSecondary'>{item.payload.date}</Typography>
      <Typography
        variant='body2' sx={{
          fontWeight: 600
        }}
      >{format.euro(Number(item.value))}
      </Typography>
    </Box>
  )
}
