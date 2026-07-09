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

// El papel de un movimiento enlazado depende de si es ingreso o gasto, y
// del tipo de rendimiento: un gasto es el impuesto retenido (intereses) o
// el recibo que generó el cashback — sin necesidad de ningún campo nuevo.
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
          {entries.map((e) => (
            <ListItem key={e._id} disablePadding sx={{ py: 0.25 }}>
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
                      {format.date(e.date)} · {roleLabel(e.type, yieldType)}
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
                          color: e.type === 'income' ? 'success.main' : 'text.primary'
                        }}
                      >
                        {format.euro(e.amount)}
                      </Typography>
                      <Tooltip title='Desvincular'>
                        <IconButton
                          size='small'
                          aria-label='Desvincular'
                          onClick={() => onUnlink(yieldId, e._id)}
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
