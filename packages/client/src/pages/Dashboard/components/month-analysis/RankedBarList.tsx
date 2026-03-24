import React from 'react'
import { Grid, Grow, Stack, Box, Typography, LinearProgress } from '@mui/material'
import { format } from 'utils'
import MainCard from 'components/MainCard'
import { hoverCardSx } from '../shared'
interface RankedItem {
  name: string
  amount: number
}

interface RankedBarListProps {
  title: string
  secondary?: React.ReactNode
  items: RankedItem[]
  chartColors: string[]
  colorOffset?: number
  emptyMessage: string
  growTimeout: number
  gridSize?: { xs: number; md: number }
}

const RankedBarList = ({
  title,
  secondary,
  items,
  chartColors,
  colorOffset = 0,
  emptyMessage,
  growTimeout,
  gridSize = { xs: 12, md: 6 }
}: RankedBarListProps) => {
  const max = items[0]?.amount ?? 1

  return (
    <Grow in timeout={growTimeout}>
      <Grid size={gridSize}>
        <MainCard title={title} sx={hoverCardSx} secondary={secondary}>
          {items.length > 0
            ? (
              <Stack spacing={2}>
                {items.map((item, i) => {
                  const color = chartColors[(i + colorOffset) % chartColors.length]
                  return (
                    <Box key={item.name}>
                      <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
                        <Stack direction='row' alignItems='center' gap={0.75}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                          <Typography variant='body1'>{item.name}</Typography>
                        </Stack>
                        <Typography variant='subtitle1'>{format.euro(item.amount)}</Typography>
                      </Stack>
                      <LinearProgress
                        variant='determinate'
                        value={(item.amount / max) * 100}
                        sx={{
                          borderRadius: 1,
                          height: 6,
                          '& .MuiLinearProgress-bar': { bgcolor: color }
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
              )
            : (
              <Typography variant='body1' color='textSecondary'>{emptyMessage}</Typography>
              )}
        </MainCard>
      </Grid>
    </Grow>
  )
}

export default RankedBarList
