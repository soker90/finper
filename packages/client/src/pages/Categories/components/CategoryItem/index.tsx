import { FC, useCallback, useState } from 'react'
import { Chip, Collapse, Divider, Paper, Typography, useTheme } from '@mui/material'

import { Category } from 'types'
import styles from './styles.module.css'

import CategorytEdit from '../CategorytEdit'
import { TransactionType } from 'types/transaction'

const CATEGORY_TYPE = {
  [TransactionType.Income]: 'Ingreso',
  [TransactionType.Expense]: 'Gasto',
  [TransactionType.NotComputable]: 'No computable'

}

interface CategoryItemProps {
    category: Category
    forceExpand?: boolean
    cancelCreate?: () => void
    rootCategories: Category[]
}

const CategoryItem: FC<CategoryItemProps> = ({ category, forceExpand, cancelCreate, rootCategories }) => {
  const theme = useTheme()
  const [expand, setExpand] = useState(forceExpand)

  const hideForm = useCallback(() => {
    cancelCreate?.()
    setExpand(false)
  }, [category._id])

  return (
        <>
            <Paper component='li'>
                <section onClick={() => setExpand(toggle => !toggle)}>
                    <div className={styles.logoName}>
                        {/* <BankIcon name={category.bank} className={styles.bankLogo} /> */}
                        <span>{category.name}</span>
                        {!category.parent && <Chip
                            label='Principal'
                            size="small"
                            color="success"
                            sx={{ height: 16, '& .MuiChip-label': { fontSize: '0.75rem', py: 0.25 }, ml: 1 }}
                        />}
                    </div>
                    <Typography variant='h4'
                                color={theme.palette.primary.main}>{CATEGORY_TYPE[category.type]}</Typography>
                </section>
                <Collapse in={expand} timeout="auto" unmountOnExit>
                    <Divider className={styles.divider} />
                    <CategorytEdit category={category} hideForm={hideForm} isNew={forceExpand}
                                   rootCategories={rootCategories} />

                </Collapse>
            </Paper>

        </>

  )
}

export default CategoryItem
