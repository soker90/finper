import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Alert, Box, Autocomplete, TextField, InputLabel, FormHelperText, Stack, Grid } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import SelectForm from 'components/forms/SelectForm'
import InputForm from 'components/forms/InputForm'
import { useAccounts } from 'hooks/useAccounts'
import { useCategories } from 'hooks/useCategories'
import { Yield, YieldInput } from 'types'

const YIELD_TYPE_OPTIONS = [
  { value: 'interest', label: 'Intereses' },
  { value: 'cashback', label: 'Cashback' }
]

type Props = {
  editingYield?: Yield
  onClose: () => void
  onSubmit: (data: YieldInput) => Promise<{ error?: string }>
}

const YieldForm = ({ editingYield, onClose, onSubmit }: Props) => {
  const { accounts } = useAccounts()
  const { categories } = useCategories()

  const defaultValues = editingYield
    ? {
        name: editingYield.name,
        type: editingYield.type,
        accountId: editingYield.accountId,
        categoryIds: editingYield.categoryIds || []
      }
    : {
        name: '',
        type: 'interest' as const,
        accountId: '',
        categoryIds: []
      }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<YieldInput>({
    defaultValues
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change; defaultValues is rebuilt each render by design
  }, [reset, editingYield, accounts, categories])

  const handleFormSubmit = handleSubmit(async (data) => {
    setSubmitError(null)
    const result = await onSubmit(data)
    if (result?.error) {
      setSubmitError(result.error)
      return
    }
    onClose()
  })

  return (
    <ModalGrid
      show
      title={editingYield ? 'Editar rendimiento' : 'Nuevo rendimiento'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='name'
        label='Nombre (opcional)'
        placeholder='Por defecto: Cuenta - Tipo'
        size={6}
        error={false}
        errorText=''
        {...register('name')}
      />

      <SelectForm
        id='type'
        label='Tipo'
        size={3}
        options={YIELD_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        error={Boolean(errors.type)}
        errorText='El tipo es obligatorio'
        {...register('type', { required: true })}
      />

      <SelectForm
        id='accountId'
        label='Cuenta'
        size={3}
        options={accounts}
        optionValue='_id'
        optionLabel='name'
        voidOption
        error={Boolean(errors.accountId)}
        errorText='La cuenta es obligatoria'
        {...register('accountId', { required: true })}
      />

      <Grid size={{ md: 12, xs: 12 }}>
        <Stack spacing={1}>
          <InputLabel htmlFor='categoryIds'>Categorías principales</InputLabel>
          <Controller
            name='categoryIds'
            control={control}
            rules={{ required: true, validate: (val) => val && val.length > 0 }}
            render={({ field }) => (
              <Autocomplete
                multiple
                id='categoryIds'
                options={categories}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                value={categories.filter((c) => c._id && field.value?.includes(c._id)) || []}
                onChange={(_, newValue) => {
                  const ids = newValue.flatMap((v) => typeof v === 'string' ? [v] : (v._id ? [v._id] : []))
                  field.onChange(ids)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(errors.categoryIds)}
                    placeholder={field.value?.length ? '' : 'Selecciona una o más categorías'}
                  />
                )}
              />
            )}
          />
          {errors.categoryIds && (
            <FormHelperText error>Selecciona al menos una categoría</FormHelperText>
          )}
        </Stack>
      </Grid>

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default YieldForm
