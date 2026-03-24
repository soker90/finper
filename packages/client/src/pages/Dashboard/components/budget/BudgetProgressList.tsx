import { Stack, Box, Typography, LinearProgress } from '@mui/material'
import { format } from 'utils'

export interface BudgetRow {
  name: string
  real: number
  estimated: number
  pct: number
  over: boolean
}

const BudgetProgressList = ({
  rows,
  emptyMessage
}: {
  rows: BudgetRow[]
  emptyMessage: string
}) => {
  if (rows.length === 0) {
    return <Typography variant='body1' color='textSecondary'>{emptyMessage}</Typography>
  }
  return (
    <Stack spacing={2}>
      {rows.map(row => (
        <Box key={row.name}>
          <Stack direction='row' justifyContent='space-between' sx={{ mb: 0.5 }}>
            <Typography variant='body1'>{row.name}</Typography>
            <Typography variant='body1' color={row.over ? 'error.main' : 'textSecondary'}>
              {format.euro(row.real)}
              <Typography component='span' variant='body2' color='textSecondary'>
                {' '}/ {format.euro(row.estimated)}
              </Typography>
            </Typography>
          </Stack>
          <LinearProgress
            variant='determinate'
            value={row.pct}
            color={row.over ? 'error' : row.pct > 80 ? 'warning' : 'success'}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
      ))}
    </Stack>
  )
}

export default BudgetProgressList
