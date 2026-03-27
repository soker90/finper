import { Stack, Typography, LinearProgress, Box } from '@mui/material'
import { MainCard } from 'components'
import { BankIcon } from 'components/icons'
import { useAccounts } from 'hooks'
import { format } from 'utils'
import { Loan } from 'types'

interface Props {
  loan: Loan
  onClick: (loan: Loan) => void
}

const LoanCard = ({ loan, onClick }: Props) => {
  const { accounts } = useAccounts()
  const linkedAccount = accounts.find(a => a._id === loan.account)
  const progress = loan.initialAmount > 0
    ? Math.round(((loan.initialAmount - loan.pendingAmount) / loan.initialAmount) * 100)
    : 0

  return (
    <MainCard
      contentSX={{ p: 2.25, cursor: 'pointer' }}
      onClick={() => onClick(loan)}
    >
      <Stack spacing={1}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h6' color='textSecondary' noWrap>
            {loan.name}
          </Typography>
          <BankIcon name={linkedAccount?.bank ?? ''} width={28} height={28} />
        </Box>

        <Typography variant='h4' color='inherit'>
          {format.euro(loan.pendingAmount)}
          <Typography component='span' variant='body2' color='textSecondary' ml={1}>
            pendiente
          </Typography>
        </Typography>

        <LinearProgress
          variant='determinate'
          value={progress}
          sx={{ height: 6, borderRadius: 3 }}
          color='primary'
        />

        <Box display='flex' justifyContent='space-between'>
          <Typography variant='caption' color='textSecondary'>
            Cuota: {format.euro(loan.monthlyPayment)}/mes
          </Typography>
          <Typography variant='caption' color='textSecondary'>
            {progress}% amortizado
          </Typography>
        </Box>

        <Typography variant='caption' color='textSecondary'>
          TIN: {loan.interestRate}%
        </Typography>
      </Stack>
    </MainCard>
  )
}

export default LoanCard
