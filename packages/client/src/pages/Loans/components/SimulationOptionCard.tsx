import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { format } from 'utils'
import { type SimulationOption } from 'types'

interface Props {
  title: string
  chipLabel: string
  option: SimulationOption
  variant: 'reduceTerm' | 'reduceQuota'
  originalMonthlyPayment?: number
}

const VARIANT_CONFIG = {
  reduceTerm: {
    color: 'success' as const,
    mainValue: (option: SimulationOption) => format.monthsDiff(option.monthsSaved),
    subtitle: (option: SimulationOption) =>
      option.newEndDate ? `Fin: ${format.date(option.newEndDate)}` : null
  },
  reduceQuota: {
    color: 'info' as const,
    mainValue: (option: SimulationOption) => `${format.euro(option.monthlySaving)}/mes`,
    subtitle: (option: SimulationOption, originalMonthlyPayment?: number) =>
      originalMonthlyPayment != null
        ? `${format.euro(originalMonthlyPayment)} → ${format.euro(option.newMonthlyPayment)}`
        : format.euro(option.newMonthlyPayment)
  }
} as const

const SimulationOptionCard = ({ title, chipLabel, option, variant, originalMonthlyPayment }: Props) => {
  const config = VARIANT_CONFIG[variant]
  const subtitleText = variant === 'reduceQuota'
    ? config.subtitle(option, originalMonthlyPayment)
    : config.subtitle(option)

  return (
    <Card sx={{ flex: 1, bgcolor: `${config.color}.50` }} variant='outlined'>
      <CardContent>
        <Stack direction='row' alignItems='center' spacing={1} mb={1}>
          <Typography variant='subtitle2'>{title}</Typography>
          <Chip label={chipLabel} size='small' variant='outlined' />
        </Stack>
        <Typography variant='h5' color={`${config.color}.main`}>
          {config.mainValue(option)}
        </Typography>
        {subtitleText && (
          <Typography variant='body2' color='textSecondary'>
            {subtitleText}
          </Typography>
        )}
        <Typography variant='body2' color={`${config.color}.dark`}>
          Ahorro: {format.euro(option.totalInterestSaved)}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default SimulationOptionCard
