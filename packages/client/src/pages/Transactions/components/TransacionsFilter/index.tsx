import { ChangeEvent } from 'react'
import { FilterParams } from '../../hooks'
import { Button, debounce, Grid } from '@mui/material'
import { ClearOutlined } from '@ant-design/icons'
import { SelectForm, SelectGroupForm } from 'components/forms'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import { useAccounts, useGroupedCategories } from 'hooks'
import AutocompleteForm from 'components/forms/AutocompleteForm'

const TransacionsFilter = ({ filters, setFilter, resetFilter }: FilterParams) => {
  const { categories } = useGroupedCategories()
  const { accounts } = useAccounts()
  return (
        <Grid container spacing={1} mt={1} mb={1}>
            <SelectForm
                id='account' label='Cuenta'
                options={accounts || []}
                optionValue='_id'
                optionLabel='name'
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('account', e.target?.value)}
                voidOption
                voidLabel=' --- '
                voidValue=''
                size={3}
                value={filters.account}
            />
            <SelectForm
                id='type' label='Tipo'
                options={TYPES_TRANSACTIONS_ENTRIES}
                optionValue={0}
                optionLabel={1}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('type', e.target?.value)}
                voidOption
                voidLabel=' --- '
                voidValue=''
                size={2}
                value={filters.type}
            />
            <SelectGroupForm
                id='category' label='Categoria'
                options={categories}
                optionValue='_id'
                optionLabel='name'
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  e.preventDefault()
                  setFilter('category', e.target?.value)
                }}
                voidOption
                value={filters.category}
                size={2}
            />
            <AutocompleteForm
                label='Tienda' id='store' value={filters.store}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  debounce(() => {
                    setFilter('store', e.target?.value)
                  }, 500)
                }}
                size={2} options={[]} optionValue='_id' optionLabel='name' />
            <Grid item xs={12} md={1.5} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button startIcon={<ClearOutlined />} size='small' onClick={resetFilter}>Limpiar</Button>
            </Grid>
        </Grid>

  )
}

export default TransacionsFilter
