import { useState } from 'react'
import { Grid } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { mutate } from 'swr'

import { HeaderButtons } from 'components'
import { useYields } from 'hooks/useYields'
import { Yield, YieldInput } from 'types'
import { YIELDS } from 'constants/api-paths'
import { unlinkYieldTransaction } from 'services/apiService'

import { YieldCard, YieldForm, LinkTransactionsModal } from './components'
import { YieldsSummary, YieldsEmpty, YieldsSkeleton } from './utils'

const Yields = () => {
  const { yields, isLoading, createYield, updateYield, removeYield } = useYields()

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Yield | undefined>()
  const [searchTarget, setSearchTarget] = useState<Yield | null>(null)

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

  const handleUnlinkTransaction = async (yieldId: string, transactionId: string) => {
    await unlinkYieldTransaction(yieldId, transactionId)
    mutate(YIELDS)
    mutate(`${YIELDS}/${yieldId}`)
  }

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nuevo', onClick: () => setShowForm(true) }]}
        desktopSx={{ marginTop: -7 }}
      />

      <YieldsSummary items={yields} />

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
                onEdit={handleEdit}
                onDelete={(y) => removeYield(y._id)}
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
    </>
  )
}

export default Yields
