import { Grid } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { HeaderButtons } from 'components'
import { Debt } from 'types'

import { DebtCard, DebtTable, DebtEditModal, DebtRemoveModal } from './components'
import { useDebts } from './hooks'

const Debts = () => {
  const { from, to, debtsByPerson } = useDebts()
  const [selectedDebt, setSelectedDebt] = useState<Debt>()
  const [selectedForRemove, setSelectedForRemove] = useState<Debt>()

  const handleClickNew = () => setSelectedDebt({} as Debt)

  const handleEdit = (debt: Debt) => {
    setSelectedDebt(debt)
  }

  const handleDelete = (debt: Debt) => {
    setSelectedForRemove(debt)
  }

  return (
        <>
            <HeaderButtons
                buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew }]}
                desktopSx={{ marginTop: -7 }}
            />
            <Grid container spacing={3} mb={2} mt={2}>
                {debtsByPerson.map((debt) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={debt._id}>
                        <DebtCard person={debt._id} amount={debt.total}/>
                    </Grid>
                ))}
            </Grid>
            <Grid container spacing={3}>
                <DebtTable debts={from} title='Me deben' fromTitle='De' onEdit={handleEdit} onRemove={handleDelete}/>
                <DebtTable debts={to} title='Debo' fromTitle='A' onEdit={handleEdit} onRemove={handleDelete}/>
            </Grid>
            {Boolean(selectedDebt) && <DebtEditModal
              debt={selectedDebt}
              onClose={() => setSelectedDebt(undefined)}
            />}
            {!!selectedForRemove &&
              <DebtRemoveModal debt={selectedForRemove} onClose={() => setSelectedForRemove(undefined)}/>}
        </>
  )
}

export default Debts
