import { useCallback, useState } from 'react'
import { useAccounts } from './hooks'
import { LoadingBanks, AccountItem } from './components'
import { Button, Stack, IconButton } from '@mui/material'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons } from 'components'

const Accounts = () => {
  const { accounts, isLoading } = useAccounts()
  const [newAccount, setNewAccount] = useState(false)

  if (isLoading) {
    return <LoadingBanks />
  }

  if (!accounts.length) {
    return <p>No hay datos</p>
  }

  const handleClickNew = () => {
    setNewAccount(true)
  }

  const cancelCreate = () => setNewAccount(false)

  return (<>
            <HeaderButtons
                buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newAccount }]} />

            <ListContainer>
                {newAccount &&
                  <AccountItem account={{ name: '', bank: '', balance: 0 }} forceExpand cancelCreate={cancelCreate} />}
                {accounts.map((account) => <AccountItem key={account._id} account={account} />)}
            </ListContainer>
        </>
  )
}

export default Accounts
