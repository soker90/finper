import { useState } from 'react'
import { Grid, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useSWRConfig } from 'swr'

import { HeaderButtons } from 'components'
import { useYields, useUnlinkYieldTransaction } from 'hooks/useYields'
import { Yield, YieldInput } from 'types'
import { YIELDS, YIELD_DETAIL, YIELD_MATCHING_TRANSACTIONS } from 'constants/api-paths'

import { YieldCard, YieldForm, LinkTransactionsModal, YieldRemoveModal } from './components'
import { YieldsSummary, YieldsEmpty, YieldsSkeleton } from './utils'

const Yields = () => {
  const { mutate } = useSWRConfig()
  const { yields, isLoading, createYield, updateYield } = useYields()
  const unlinkTransaction = useUnlinkYieldTransaction()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Yield | undefined>()
  const [searchTarget, setSearchTarget] = useState<Yield | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Yield | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const availableYears = (() => {
    const yearsSet = new Set<number>()
    for (const yieldItem of yields) {
      for (const stat of yieldItem.annualBreakdown ?? []) {
        yearsSet.add(stat.year)
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a)
  })()

  const handleEdit = (y: Yield) => setEditTarget(y)
  const handleCloseForm = () => { setShowForm(false); setEditTarget(undefined) }

  const handleSubmitForm = (data: YieldInput) =>
    editTarget?._id
      ? updateYield(editTarget._id, data)
      : createYield(data)

  const handleLinked = () => {
    mutate(YIELDS)
    if (searchTarget) {
      mutate(YIELD_DETAIL(searchTarget._id))
      mutate(YIELD_MATCHING_TRANSACTIONS(searchTarget._id))
    }
  }

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nuevo', onClick: () => setShowForm(true) }]}
        desktopSx={{ marginTop: -7 }}
      />

      {availableYears.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <ToggleButtonGroup
            size='small'
            value={selectedYear}
            exclusive
            onChange={(_, val) => {
              if (val !== null) setSelectedYear(val)
            }}
            aria-label='Filtrar por año'
            color='primary'
          >
            <ToggleButton value='all' sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>
              Histórico completo
            </ToggleButton>
            {availableYears.map((yr) => (
              <ToggleButton key={yr} value={yr} sx={{ px: 2, fontWeight: 600 }}>
                {yr}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <YieldsSummary items={yields} selectedYear={selectedYear} />

      {isLoading && <YieldsSkeleton />}

      {!isLoading && yields.length === 0 && (
        <YieldsEmpty onNew={() => setShowForm(true)} />
      )}

      {!isLoading && yields.length > 0 && (
        <Grid container spacing={2}>
          {yields.map((item) => (
            <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <YieldCard
                item={item}
                selectedYear={selectedYear}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onSearchTransactions={setSearchTarget}
                onUnlinkTransaction={unlinkTransaction}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {(showForm || Boolean(editTarget)) && (
        <YieldForm
          editingYield={editTarget}
          onClose={handleCloseForm}
          onSubmit={handleSubmitForm}
        />
      )}

      {searchTarget && (
        <LinkTransactionsModal
          item={searchTarget}
          onClose={() => setSearchTarget(null)}
          onLinked={handleLinked}
        />
      )}

      {deleteTarget && (
        <YieldRemoveModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

export default Yields
