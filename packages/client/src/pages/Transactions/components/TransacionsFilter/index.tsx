import { FilterParams } from '../../hooks'
import { Button, Stack, Typography } from '@mui/material'
import { ClearOutlined } from '@ant-design/icons'
import { SelectForm } from 'components/forms'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'
import { useCategories } from '../../../Categories/hooks'
import { ChangeEvent } from 'react'

const TransacionsFilter = ({ filters, setFilter, resetFilter }: FilterParams) => {
  const { categories } = useCategories()
  return (
        <Stack spacing={1} direction='row'>
            <Typography variant='body1'>Filtros</Typography>
            <Button startIcon={<ClearOutlined />} size='small' onClick={resetFilter}>Limpiar</Button>
            <SelectForm id='type' label='Tipo'
                        options={TYPES_TRANSACTIONS_ENTRIES}
                        optionValue={0}
                        optionLabel={1}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter('type', e.target?.value)}
                        voidOption
                        voidLabel=' --- '
                        voidValue=''
            />
            <SelectForm id='category' label='Categoria'
                        options={categories}
                        optionValue='_id'
                        optionLabel='name'
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          e.preventDefault()
                          setFilter('category', e.target?.value)
                        }}
                        voidOption
            />
        </Stack>

  )
}

export default TransacionsFilter
