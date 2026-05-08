import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { Transaction } from 'types'
import { format } from 'utils'

const AMOUNT_COLORS: Record<string, string> = {
  expense: 'error.main',
  income: 'success.main',
  not_computable: 'secondary.main'
}

const TagTransactionList = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <Box>
      <Typography variant='h5' mb={2}>Movimientos ({transactions.length})</Typography>
      <Stack spacing={1}>
        {transactions.map((transaction) => (
          <Paper key={transaction._id} sx={{ p: 2 }}>
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Typography variant='body2' color='text.secondary'>
                  {format.date(transaction.date)}
                </Typography>
                <Typography variant='body1'>{transaction.category?.name}</Typography>
                {transaction.store && (
                  <Typography variant='body2' color='text.secondary'>
                    ({transaction.store.name})
                  </Typography>
                )}
                {transaction.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size='small' variant='outlined' />
                ))}
              </Stack>
              <Typography variant='h5' color={AMOUNT_COLORS[transaction.type] || 'text.primary'}>
                -{format.euro(transaction.amount)}
              </Typography>
            </Stack>
            {transaction.note && (
              <Typography variant='body2' color='text.secondary' mt={0.5}>
                {transaction.note}
              </Typography>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  )
}

export default TagTransactionList
