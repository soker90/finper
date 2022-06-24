import { useMemo, useState } from 'react'
import { useCategories } from './hooks'
import { CategoryItem } from './components'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons, LoadingList } from 'components'
import { TransactionType } from 'types/transaction'

const Accounts = () => {
  const { categories, isLoading } = useCategories()
  const [newAccount, setNewAccount] = useState(false)

  const rootCategories = useMemo(() => {
    return categories?.filter(category => !category.parent)
  }, [categories])

  if (isLoading) {
    return <LoadingList />
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
                  <CategoryItem category={{ name: '', type: TransactionType.Expense }} forceExpand
                                cancelCreate={cancelCreate} rootCategories={rootCategories} />}
                {categories.map((category) => <CategoryItem key={category._id} category={category}
                                                            rootCategories={rootCategories} />)}
            </ListContainer>

            {!categories.length && <p>No hay datos</p>}
        </>
  )
}

export default Accounts
