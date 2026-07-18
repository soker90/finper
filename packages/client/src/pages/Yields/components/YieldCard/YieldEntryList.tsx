import { Box, Divider, IconButton, List, ListItem, ListItemText, Tooltip, Typography } from '@mui/material'
import { DisconnectOutlined } from '@ant-design/icons'
import { format } from 'utils'
import { YieldEntry, YieldType } from 'types'

type Props = {
  entries: YieldEntry[]
  yieldId: string
  yieldType: YieldType
  onUnlink: (yieldId: string, transactionId: string) => void
}

// A linked movement's role depends on whether it's an income or an expense,
// and on the yield type: an expense is the withheld tax (interest) or the
// receipt that generated the cashback.
const roleLabel = (entryType: string, yieldType: YieldType): string => {
  if (entryType === 'income') return 'Abono'
  return yieldType === 'interest' ? 'Impuesto' : 'Recibo'
}

const YieldEntryList = ({ entries, yieldId, yieldType, onUnlink }: Props) => {
  if (entries.length === 0) return null

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
          Últimos movimientos
        </Typography>
        <List dense disablePadding>
          {entries.map((entry) => (
            <ListItem key={entry._id} disablePadding sx={{ py: 0.25 }}>
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
                      {format.date(entry.date)} · {roleLabel(entry.type, yieldType)}
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
                          fontWeight: 600,
                          color: entry.type === 'income' ? 'success.main' : 'text.primary'
                        }}
                      >
                        {format.euro(entry.amount)}
                      </Typography>
                      <Tooltip title='Desvincular'>
                        <IconButton
                          size='small'
                          aria-label='Desvincular'
                          onClick={() => onUnlink(yieldId, entry._id)}
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

export default YieldEntryList
