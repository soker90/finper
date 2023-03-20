import { Grid } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { HeaderButtons } from 'components'

import { PensionTransactionsTable, PensionStatCard } from './components'
import { STATS } from './constants'
import { usePensions } from './hooks'
import TransactionModal from './components/TransactionModal'
import { PensionTransaction } from 'types/pension'

const Pension = () => {
  const { pension, editPension, addPension } = usePensions()
  const [selectedTransaction, setSelectedTransaction] = useState<PensionTransaction>()

  if (!pension) return null
  return (
        <>
            <HeaderButtons
                buttons={[{
                  Icon: PlusOutlined,
                  title: 'Nueva',
                  onClick: () => setSelectedTransaction({} as PensionTransaction)
                }]}
                desktopSx={{ marginTop: -7 }}
            />
            <Grid container spacing={3} mb={2}>
                {STATS.map((stat) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={stat.title}>
                        <PensionStatCard title={stat.title} amount={pension[stat.value]} currency={stat.currency}/>
                    </Grid>
                ))}
            </Grid>
            <PensionTransactionsTable transactions={pension.transactions}/>
            <TransactionModal
                transaction={selectedTransaction}
                show={Boolean(selectedTransaction)}
                onClose={() => setSelectedTransaction(undefined)}
                editPension={editPension}
                addPension={addPension}/>
        </>
  )
}

export default Pension
