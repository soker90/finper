import { useState } from 'react'
import { useCategories } from 'hooks'
import { CategoryItem } from './components'
import { PlusOutlined } from '@ant-design/icons'
import { ListContainer } from './components/ListContainer'
import { HeaderButtons, LoadingList } from 'components'

const Accounts = () => {
  const { categories, isLoading } = useCategories()
  const [newAccount, setNewAccount] = useState(false)

  const rootCategories = categories?.filter(category => !category.parent)

  if (isLoading) {
    return <LoadingList />
  }
  const handleClickNew = () => {
    setNewAccount(true)
  }

  const cancelCreate = () => setNewAccount(false)

  return (
    <>
      <HeaderButtons
        buttons={[{ Icon: PlusOutlined, title: 'Nueva', onClick: handleClickNew, disabled: newAccount }]}
        desktopSx={{ marginTop: -7 }}
      />

      <ListContainer>
        {newAccount &&
          <CategoryItem
            category={{ name: '', type: 'expense' }} forceExpand
            cancelCreate={cancelCreate} rootCategories={rootCategories}
          />}
        {categories.map((category) => <CategoryItem
          key={category._id} category={category}
          rootCategories={rootCategories}
                                      />)}
      </ListContainer>

      {!categories.length && <p>No hay datos</p>}
    </>
  )
}

export default Accounts
