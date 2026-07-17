import React from 'react'
import { Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
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
  selectedYear?: number | 'all'
  onEdit: (y: Yield) => void
  onDelete: (y: Yield) => void
  onSearchTransactions: (y: Yield) => void
  onUnlinkTransaction: (yieldId: string, transactionId: string) => void
}

const YieldCard = ({ item, selectedYear = 'all', onEdit, onDelete, onSearchTransactions, onUnlinkTransaction }: Props) => {
  const navigate = useNavigate()
  const { data: detail } = useSWR<Yield & { entries: YieldEntry[] }>(`${YIELDS}/${item._id}`)
  const lastEntries = detail?.entries.slice(0, 3) ?? []

  const isAnnual = selectedYear !== 'all'
  const annualStats = isAnnual ? item.annualBreakdown?.find(a => a.year === selectedYear) : undefined
  const displayNet = isAnnual
    ? (annualStats?.net ?? 0)
    : item.netAccumulated
  const displayLabel = isAnnual ? `neto en ${selectedYear}` : 'neto acumulado'

  let annualPercentageLabel: string | null = null
  if (isAnnual && item.type === 'cashback' && annualStats) {
    if ((annualStats.billsTotal ?? 0) > 0 && (annualStats.cashbackAmount ?? 0) > 0) {
      const rate = (annualStats.cashbackAmount / annualStats.billsTotal) * 100
      if (rate > 0) {
        annualPercentageLabel = `% devuelto en ${selectedYear}: ${format.number(rate)}%`
      }
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return
    }
    navigate(`/rendimientos/${item._id}`)
  }

  return (
    <MainCard contentSX={{ p: 2.25 }} sx={{ ...hoverCardSx, cursor: 'pointer' }} onClick={handleCardClick}>
      <Stack spacing={1}>
        <YieldCardHeader
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onSearchTransactions={onSearchTransactions}
        />

        <Typography variant='h4' color='inherit'>
          {format.euro(displayNet)}
          <Typography
            component='span' variant='body2' color='textSecondary' sx={{
              ml: 1
            }}
          >
            {displayLabel}
          </Typography>
        </Typography>

        {annualPercentageLabel && (
          <Typography variant='body2' color='primary.main' sx={{ fontWeight: 600 }}>
            {annualPercentageLabel}
          </Typography>
        )}

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
