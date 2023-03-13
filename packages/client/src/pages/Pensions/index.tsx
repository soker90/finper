import { Grid } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { HeaderButtons } from 'components'

import { PensionTransactionsTable, PensionStatCard } from './components'
import { STATS } from './constants'
import { usePensions } from './hooks'
import TransactionModal from './components/TransactionModal'

const Pension = () => {
  const { pension } = usePensions()
  const [showModal, setShowModal] = useState(false)

  if (!pension) return null
  return (
        <>
            <HeaderButtons
                buttons={[{
                  Icon: PlusOutlined,
                  title: 'Nueva',
                  onClick: () => setShowModal(true)
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
            <TransactionModal show={showModal} onClose={() => setShowModal(false)}/>
        </>
  )
}

export default Pension
