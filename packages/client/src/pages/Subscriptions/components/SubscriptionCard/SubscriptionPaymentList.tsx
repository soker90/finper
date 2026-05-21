import { Box, Divider, IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material'
import { DisconnectOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { Transaction } from 'types'

type Props = {
  transactions: Transaction[]
  subscriptionId: string
  onUnlinkTransaction: (subscriptionId: string, transactionId: string) => void
}

const SubscriptionPaymentList = ({ transactions, subscriptionId, onUnlinkTransaction }: Props) => {
  if (transactions.length === 0) return null

  return (
    <>
      <Divider />
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 1, py: 0.5, mx: -1 }}>
        <Typography
          variant='caption'
          color='textSecondary'
          sx={{
            fontWeight: 600,
            display: 'block',
            mb: 0.5
          }}
        >
          Últimos pagos
        </Typography>
        <List dense disablePadding>
          {transactions.map((t) => (
            <ListItem key={t._id} disablePadding sx={{ py: 0.25 }}>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant='caption' color='textSecondary'>
                      {format.date(t.date)}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <Typography
                        variant='caption' sx={{
                          fontWeight: 600
                        }}
                      >
                        {format.euro(t.amount)}
                      </Typography>
                      <Tooltip title='Desvincular'>
                        <IconButton
                          size='small'
                          aria-label='Desvincular'
                          onClick={() => onUnlinkTransaction(subscriptionId, t._id!)}
                          sx={{ p: 0.25 }}
                        >
                          <DisconnectOutlined style={{ fontSize: 11 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  )
}

export default SubscriptionPaymentList
