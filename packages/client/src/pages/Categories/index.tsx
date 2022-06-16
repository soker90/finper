import { useState } from 'react'
import { useCategories } from './hooks'
import { CategoryItem, LoadingBanks } from './components'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons } from 'components'
import { TransactionType } from 'types/transaction'

const Accounts = () => {
  const { categories, isLoading } = useCategories()
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

            <ListContainer>
                {newAccount &&
                  <CategoryItem category={{ name: '', type: TransactionType.Expense }} forceExpand cancelCreate={cancelCreate} />}
                {categories.map((category) => <CategoryItem key={category._id} category={category} />)}
            </ListContainer>

            {!categories.length && <p>No hay datos</p>}
        </>
  )
}

export default Accounts
