import { Box, Chip, Typography } from '@mui/material'
import { format } from 'utils'

const getDaysChipColor = (days: number): 'error' | 'warning' | 'success' | 'default' => {
  if (days < 0) return 'error'
  if (days <= 3) return 'warning'
  if (days <= 7) return 'success'
  return 'default'
}

const getDaysLabel = (days: number): string => {
  if (days < 0) return `Vencida hace ${Math.abs(days)}d`
  if (days === 0) return 'Hoy'
  return `En ${days}d`
}

type Props = {
  nextPaymentDate: number | null
}

const SubscriptionNextPayment = ({ nextPaymentDate }: Props) => {
  if (!nextPaymentDate) {
    return (
      <Typography
        variant='caption' color='textSecondary' sx={{
          fontStyle: 'italic'
        }}
      >Sin pagos registrados
      </Typography>
    )
  }

  const days = Math.ceil((nextPaymentDate - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <Typography variant='caption' color='textSecondary'>
        {format.date(nextPaymentDate)}
      </Typography>
      <Chip label={getDaysLabel(days)} size='small' color={getDaysChipColor(days)} />
    </Box>
  )
}

export default SubscriptionNextPayment
