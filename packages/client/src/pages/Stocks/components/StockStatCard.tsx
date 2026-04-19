import { Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'

interface Props {
  title: string
  value: number | null
  currency?: boolean
  colorize?: boolean
}

const StockStatCard = ({ title, value, currency = true, colorize = false }: Props) => {
  const color = colorize && value !== null
    ? value >= 0 ? 'success.main' : 'error.main'
    : 'inherit'

  return (
    <MainCard contentSX={{ p: 2.25 }}>
      <Stack spacing={0.5}>
        <Typography variant='h6' color='textSecondary'>
          {title}
        </Typography>
        <Typography variant='h4' color={color} align='center'>
          {value === null ? '—' : currency ? format.euro(value) : format.number(value, { maximumFractionDigits: 2 })}
        </Typography>
      </Stack>
    </MainCard>
  )
}

export default StockStatCard
