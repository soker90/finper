import { useState } from 'react'
import { TransactionItem } from './components'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons } from 'components'
import { TransactionsPage } from './components/TransactionsPage'
import { TransactionType } from 'types/transaction'

const Transactions = () => {
  const [newTransaction, setNewTransaction] = useState(false)
  // const [pages, setPages] = useState(0)

  const handleClickNew = () => {
    setNewTransaction(true)
  }

  const cancelCreate = () => setNewTransaction(false)

  return (<>
            <HeaderButtons
                buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newTransaction }]}
                desktopSx={{ marginTop: -7 }}
            />

            <ListContainer>
                {newTransaction &&
                  <TransactionItem transaction={{
                    account: '',
                    _id: '',
                    amount: 0,
                    date: Date.now(),
                    category: '',
                    note: '',
                    store: '',
                    type: TransactionType.Expense
                  }} forceExpand cancelCreate={cancelCreate} />}
                <TransactionsPage index={0} />
            </ListContainer>
        </>
  )
}

export default Transactions