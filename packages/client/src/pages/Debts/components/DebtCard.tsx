import { Stack, Typography } from '@mui/material'
import { MainCard } from 'components'
import { format } from 'utils'

const DebtCard = ({ person, amount }: { person: string, amount: number }) => (
  <MainCard contentSX={{ p: 2.25 }}>
    <Stack spacing={0.5}>
      <Typography variant='h6' color='textSecondary'>
        {person}
      </Typography>
      <Typography variant='h4' color='inherit' align='center'>
        {format.euro(amount)}
      </Typography>
    </Stack>

  </MainCard>
)

export default DebtCard
