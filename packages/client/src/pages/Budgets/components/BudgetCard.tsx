import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { RiseOutlined, FallOutlined } from '@ant-design/icons'
import { format } from 'utils'

interface Props {
  title: string
  total: number
  estimated: number
  percentage: number
  color?: string
  isPositive: boolean
  testId?: string
}

const BudgetCard = ({ title, total, estimated, percentage, color, isPositive, testId }: Props) => {
  const isWin = total > estimated
  return (
    <MainCard contentSX={{ p: 2.25 }}>
      <Stack spacing={0.5}>
        <Typography variant='h6' color='textSecondary'>
          {title}
        </Typography>
        <Grid container alignItems='center'>
          <Grid>
            <Typography variant='h4' color='inherit' data-testid={`total-${testId}`}>
              {format.euro(total)}
            </Typography>
          </Grid>
          {!!percentage && (
            <Grid>
              <Chip
                variant='filled'
                color={isPositive ? 'success' : 'error'}
                icon={
                  <>
                    {isWin
                      ? <RiseOutlined style={{ fontSize: '0.75rem', color: 'inherit' }} />
                      : <FallOutlined style={{ fontSize: '0.75rem', color: 'inherit' }} />}
                    {' '}
                  </>
                                }
                label={`${format.number(percentage)}%`}
                sx={{ ml: 1.25, pl: 1 }}
                size='small'
              />
            </Grid>
          )}
        </Grid>
      </Stack>
      <Box sx={{ pt: 2.25 }}>
        <Typography variant='caption' color='textSecondary'>
          Estimado{' '}
          <Typography component='span' variant='caption' sx={{ color: `${color || 'primary'}.main` }}>
            {format.euro(estimated)}
          </Typography>
        </Typography>
      </Box>
    </MainCard>
  )
}
export default BudgetCard
