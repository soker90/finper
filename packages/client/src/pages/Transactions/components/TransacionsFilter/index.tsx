import { ChangeEvent } from 'react'
import { FilterParams } from '../../hooks'
import { Button, Stack, Typography } from '@mui/material'
import { ClearOutlined } from '@ant-design/icons'
import { SelectForm, SelectGroupForm } from 'components/forms'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import { useGroupedCategories } from 'hooks'

const TransacionsFilter = ({ filters, setFilter, resetFilter }: FilterParams) => {
  const { categories } = useGroupedCategories()
  return (
        <Stack spacing={1} direction='row'>
            <Typography variant='body1'>Filtros</Typography>
            <Button startIcon={<ClearOutlined />} size='small' onClick={resetFilter}>Limpiar</Button>
            <SelectForm id='type' label='Tipo'
                        options={TYPES_TRANSACTIONS_ENTRIES}
                        optionValue={0}
                        optionLabel={1}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('type', e.target?.value)}
                        voidOption
                        voidLabel=' --- '
                        voidValue=''
            />
            <SelectGroupForm id='category' label='Categoria'
                        options={categories}
                        optionValue='_id'
                        optionLabel='name'
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          e.preventDefault()
                          setFilter('category', e.target?.value)
                        }}
                        voidOption
            />
        </Stack>

  )
}

export default TransacionsFilter
