import { useState } from 'react'
import { useAccounts } from 'hooks'
import { AccountItem, TotalCard, ModalTransfer } from './components'
import { PlusOutlined, SwapOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons, LoadingList } from 'components'

const Accounts = () => {
  const { accounts, isLoading } = useAccounts()
  const [newAccount, setNewAccount] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)

  if (isLoading) {
    return <LoadingList />
  }

  const handleClickNew = () => {
    setNewAccount(true)
  }

  const cancelCreate = () => setNewAccount(false)

  const handleClickTransfer = () => {
    setShowTransfer(true)
  }

  const cancelTransfer = () => setShowTransfer(false)

  return (
    <>
      <HeaderButtons
        buttons={[
          { Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newAccount },
          { Icon: SwapOutlined, title: 'Traspaso', onClick: handleClickTransfer, disabled: accounts.length < 2 }
        ]}
        desktopSx={{ marginTop: -7 }}
      />
      <TotalCard value={accounts.reduce((sum, account) => sum + account.balance, 0)} />

      <ListContainer>
        {newAccount &&
          <AccountItem account={{ name: '', bank: '', balance: 0 }} forceExpand cancelCreate={cancelCreate} />}
        {accounts.map((account) => <AccountItem key={account._id} account={account} />)}
      </ListContainer>

      {!accounts.length && <p>No hay datos</p>}

      <ModalTransfer
        accounts={accounts}
        show={showTransfer}
        onClose={cancelTransfer}
      />
    </>
  )
}

export default Accounts
