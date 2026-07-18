import { Grid, InputLabel, Stack } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Dayjs } from 'dayjs'
import SelectForm from 'components/forms/SelectForm'
import { Category } from 'types'

interface Props {
  categories: Category[]
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  dateFrom: Dayjs | null
  onDateFromChange: (value: Dayjs | null) => void
  dateTo: Dayjs | null
  onDateToChange: (value: Dayjs | null) => void
}

/** Category and date-range filters for the candidate transactions list. */
const TransactionFilters = ({
  categories, categoryFilter, onCategoryFilterChange, dateFrom, onDateFromChange, dateTo, onDateToChange
}: Props) => {
  const showCategoryFilter = categories.length > 1

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      {showCategoryFilter && (
        <SelectForm
          id='categoryFilter'
          label='Categoría'
          options={categories}
          optionValue='_id'
          optionLabel='name'
          voidOption
          voidLabel='Todas'
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          size={4}
          error={false}
          errorText=''
        />
      )}
      <Grid size={{ md: showCategoryFilter ? 4 : 6, xs: 6 }}>
        <Stack spacing={1}>
          <InputLabel htmlFor='dateFrom'>Desde</InputLabel>
          <DatePicker
            value={dateFrom}
            onChange={onDateFromChange}
            format='DD/MM/YYYY'
            slotProps={{ textField: { id: 'dateFrom', size: 'small', fullWidth: true } }}
          />
        </Stack>
      </Grid>
      <Grid size={{ md: showCategoryFilter ? 4 : 6, xs: 6 }}>
        <Stack spacing={1}>
          <InputLabel htmlFor='dateTo'>Hasta</InputLabel>
          <DatePicker
            value={dateTo}
            onChange={onDateToChange}
            format='DD/MM/YYYY'
            slotProps={{ textField: { id: 'dateTo', size: 'small', fullWidth: true } }}
          />
        </Stack>
      </Grid>
    </Grid>
  )
}

export default TransactionFilters
