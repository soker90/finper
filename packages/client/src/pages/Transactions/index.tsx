import { useState } from 'react'
import { Button } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { TransactionItem } from './components'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons } from 'components'
import { TransactionsPage } from './components/TransactionsPage'
import { TransactionType } from 'types/transaction'
import { useFilters } from './hooks'
import TransacionsFilter from './components/TransacionsFilter'

const Transactions = () => {
  const [newTransaction, setNewTransaction] = useState(false)
  const [numPages, setNumPages] = useState(1)
  const { filters, setFilter, resetFilter } = useFilters()

  const handleClickNew = () => {
    setNewTransaction(true)
  }

  const cancelCreate = () => setNewTransaction(false)

  // TODO: Refactor this
  const pages: any = []
  for (let i = 0; i < numPages; i++) {
    pages.push(<TransactionsPage index={i} filters={filters} key={i} />)
  }

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newTransaction }]}
        desktopSx={{ marginTop: -7 }}
      />

      <TransacionsFilter filters={filters} setFilter={setFilter} resetFilter={resetFilter} />

      <ListContainer>
        {newTransaction &&
          <TransactionItem
            transaction={{
              account: '',
              _id: '',
              amount: 0,
              date: null,
              category: '',
              note: '',
              store: '',
              type: TransactionType.Expense
            } as any} forceExpand cancelCreate={cancelCreate} query=''
          />}
        {pages}
      </ListContainer>
      <Button variant='outlined' fullWidth onClick={() => setNumPages(numPages + 1)}>Cargar más</Button>
    </>
  )
}

export default Transactions
