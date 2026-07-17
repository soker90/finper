import { useState, useMemo } from 'react'
import { Grid, Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { mutate } from 'swr'

import { HeaderButtons } from 'components'
import { useYields } from 'hooks/useYields'
import { Yield, YieldInput } from 'types'
import { YIELDS } from 'constants/api-paths'
import { unlinkYieldTransaction } from 'services/apiService'

import { YieldCard, YieldForm, LinkTransactionsModal, YieldRemoveModal } from './components'
import { YieldsSummary, YieldsEmpty, YieldsSkeleton } from './utils'

const handleUnlinkTransaction = async (yieldId: string, transactionId: string) => {
  await unlinkYieldTransaction(yieldId, transactionId)
  mutate(YIELDS)
  mutate(`${YIELDS}/${yieldId}`)
}

const Yields = () => {
  const { yields, isLoading, createYield, updateYield, removeYield } = useYields()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Yield | undefined>()
  const [searchTarget, setSearchTarget] = useState<Yield | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Yield | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    for (const y of yields) {
      if (y.annualBreakdown) {
        for (const a of y.annualBreakdown) {
          yearsSet.add(a.year)
        }
      }
    }
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [yields])

  const handleEdit = (y: Yield) => setEditTarget(y)
  const handleCloseForm = () => { setShowForm(false); setEditTarget(undefined) }

  const handleSubmitForm = (data: YieldInput) =>
    editTarget?._id
      ? updateYield(editTarget._id, data)
      : createYield(data)

  const handleLinked = () => {
    mutate(YIELDS)
    if (searchTarget) {
      mutate(`${YIELDS}/${searchTarget._id}`)
      mutate(`${YIELDS}/${searchTarget._id}/matching-transactions`)
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
                onUnlinkTransaction={handleUnlinkTransaction}
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
          onConfirm={async () => {
            await removeYield(deleteTarget._id)
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}

export default Yields
