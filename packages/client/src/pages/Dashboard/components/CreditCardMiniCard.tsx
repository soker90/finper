import { Stack, Typography, LinearProgress, Box } from '@mui/material'
import { MainCard } from 'components'
import { BankIcon } from 'components/icons'
import { format } from 'utils'
import { CreditCard } from 'types'

interface Props {
  card: CreditCard
  onClick: (card: CreditCard) => void
}

const CreditCardMiniCard = ({ card, onClick }: Props) => {
  const currentDebt = card.currentDebt ?? 0
  const limit = card.limit
  const hasLimit = limit !== null && limit !== undefined && limit > 0
  const usagePercent = hasLimit ? Math.min(100, Math.round((currentDebt / limit) * 100)) : 0
  const availableCredit = hasLimit ? Math.max(0, limit - currentDebt) : null
  const cardBank = card.logoBank || card.account?.bank || ''

  return (
    <MainCard
      contentSX={{ p: 2.25, cursor: 'pointer' }}
      onClick={() => onClick(card)}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography variant='h6' color='textSecondary' noWrap>
            {card.name}
          </Typography>
          <BankIcon name={cardBank} width={28} height={28} />
        </Box>

        <Typography variant='h4' color='inherit'>
          {format.euro(currentDebt)}
          <Typography
            component='span' variant='body2' color='textSecondary' sx={{
              ml: 1
            }}
          >
            de deuda
          </Typography>
        </Typography>

        <LinearProgress
          variant='determinate'
          value={usagePercent}
          sx={{ height: 6, borderRadius: 3 }}
          color={usagePercent > 85 ? 'error' : usagePercent > 60 ? 'warning' : 'primary'}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant='caption' color='textSecondary'>
            Disponible: {hasLimit ? format.euro(availableCredit ?? 0) : '—'}
          </Typography>
          <Typography variant='caption' color='textSecondary'>
            {usagePercent}% usado
          </Typography>
        </Box>

        <Typography variant='caption' color='textSecondary'>
          Límite: {hasLimit ? format.euro(limit) : 'Sin límite configurado'}
        </Typography>
      </Stack>
    </MainCard>
  )
}

export default CreditCardMiniCard
