import { Stack, Typography } from '@mui/material'
import useSWR from 'swr'
import { MainCard } from 'components'
import { format } from 'utils'
import { Yield, YieldEntry } from 'types'
import { YIELDS } from 'constants/api-paths'
import { hoverCardSx } from '../../../Dashboard/components/shared'
import YieldCardHeader from './YieldCardHeader'
import YieldEntryList from './YieldEntryList'

type Props = {
  item: Yield
  onEdit: (y: Yield) => void
  onDelete: (y: Yield) => void
  onSearchTransactions: (y: Yield) => void
  onUnlinkTransaction: (yieldId: string, transactionId: string) => void
}

const YieldCard = ({ item, onEdit, onDelete, onSearchTransactions, onUnlinkTransaction }: Props) => {
  const { data: detail } = useSWR<Yield & { entries: YieldEntry[] }>(`${YIELDS}/${item._id}`)
  const lastEntries = detail?.entries.slice(0, 3) ?? []

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={hoverCardSx}>
      <Stack spacing={1}>
        <YieldCardHeader
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onSearchTransactions={onSearchTransactions}
        />

        <Typography variant='h4' color='inherit'>
          {format.euro(item.netAccumulated)}
          <Typography
            component='span' variant='body2' color='textSecondary' sx={{
              ml: 1
            }}
          >
            neto acumulado
          </Typography>
        </Typography>

        <Typography variant='caption' color='textSecondary'>
          {item.account.name} ({item.account.bank}) · {item.paymentsCount} abono{item.paymentsCount === 1 ? '' : 's'}
        </Typography>

        <YieldEntryList
          entries={lastEntries}
          yieldId={item._id}
          yieldType={item.type}
          onUnlink={onUnlinkTransaction}
        />
      </Stack>
    </MainCard>
  )
}

export default YieldCard
