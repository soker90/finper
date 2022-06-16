import { useState } from 'react'
import { useAccounts } from './hooks'
import { LoadingBanks, AccountItem } from './components'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons } from 'components'

const Accounts = () => {
  const { accounts, isLoading } = useAccounts()
  const [newAccount, setNewAccount] = useState(false)

  if (isLoading) {
    return <LoadingBanks />
  }

  const handleClickNew = () => {
    setNewAccount(true)
  }

  const cancelCreate = () => setNewAccount(false)

  return (<>
            <HeaderButtons
                buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newAccount }]}
                desktopSx={{ marginTop: -7 }}
            />

            {!!accounts.length && <ListContainer>
                {newAccount &&
                  <AccountItem account={{ name: '', bank: '', balance: 0 }} forceExpand cancelCreate={cancelCreate} />}
                {accounts.map((account) => <AccountItem key={account._id} account={account} />)}
            </ListContainer>}

            {!accounts.length && <p>No hay datos</p>}
        </>
  )
}

export default Accounts
