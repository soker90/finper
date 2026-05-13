import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import { MainCard } from 'components'

interface Props {
  totalBalance: number
  totalAllocated: number
  unallocated: number
  format: (n: number) => string
}

const TotalCard = ({ totalBalance, totalAllocated, unallocated, format }: Props) => {
  const progress = totalBalance > 0
    ? Math.min(Math.round((totalAllocated / totalBalance) * 100), 100)
    : 0

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={{ mb: 2, mt: { xs: 2, sm: 2 } }}>
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 0.5
          }}
        >
          <Typography variant='h6' color='textSecondary'>
            Saldo disponible para metas
          </Typography>
          <Typography
            variant='h4' sx={{
              color: 'success.main'
            }}
          >
            {format(unallocated)}
            <Typography
              component='span' variant='body2' color='textSecondary' sx={{
                ml: 1
              }}
            >
              sin asignar
            </Typography>
          </Typography>
        </Box>

        <LinearProgress
          variant='determinate'
          value={progress}
          sx={{ height: 8, borderRadius: 3 }}
          color='primary'
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant='caption' color='textSecondary'>
            Asignado: {format(totalAllocated)}
          </Typography>
          <Typography variant='caption' color='textSecondary'>
            Total: {format(totalBalance)} — {progress}% asignado
          </Typography>
        </Box>
      </Stack>
    </MainCard>
  )
}

export default TotalCard
