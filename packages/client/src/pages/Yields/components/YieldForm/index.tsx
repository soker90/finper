import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Alert, Box, Button, Autocomplete, TextField, InputLabel, FormHelperText, Stack, Grid } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import SelectForm from 'components/forms/SelectForm'
import { useAccounts } from 'hooks/useAccounts'
import { useCategories } from 'hooks/useCategories'
import { useSubmitError } from '../../hooks/useSubmitError'
import { useSnackbar } from 'contexts'
import { Yield, YieldInput } from 'types'

const YIELD_TYPE_OPTIONS = [
  { value: 'interest', label: 'Remunerada' },
  { value: 'cashback', label: 'Cashback' }
]

type SubmitResult = { error?: string, existingYieldId?: string }

type Props = {
  editingYield?: Yield
  onClose: () => void
  onSubmit: (data: YieldInput) => Promise<SubmitResult>
}

const YieldForm = ({ editingYield, onClose, onSubmit }: Props) => {
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const navigate = useNavigate()

  const defaultValues = editingYield
    ? {
        type: editingYield.type,
        accountId: editingYield.accountId,
        categoryIds: editingYield.categoryIds || [],
        taxCategoryId: editingYield.taxCategoryId ?? ''
      }
    : {
        type: 'interest' as const,
        accountId: '',
        categoryIds: [],
        taxCategoryId: ''
      }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch, setValue } = useForm<YieldInput>({
    defaultValues
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is safe here; no compiler-incompatible pattern
  const watchedType = watch('type')
  const watchedCategoryIds = watch('categoryIds')
  const watchedTaxCategoryId = watch('taxCategoryId')
  const taxCategoryOptions = categories.filter((category) => category._id && watchedCategoryIds?.includes(category._id))

  useEffect(() => {
    if (watchedType !== 'cashback' || (watchedTaxCategoryId && !watchedCategoryIds?.includes(watchedTaxCategoryId))) {
      setValue('taxCategoryId', '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- clears taxCategoryId only when it becomes invalid for the current type/categories
  }, [watchedType, watchedCategoryIds])

  const { error: submitError, result: submitResult, runSubmit } = useSubmitError<SubmitResult>()
  const { showSuccess } = useSnackbar()

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change; defaultValues is rebuilt each render by design
  }, [reset, editingYield])

  const handleFormSubmit = handleSubmit((data) => runSubmit(() => onSubmit({ ...data, taxCategoryId: data.taxCategoryId || null }), () => {
    onClose()
    showSuccess(editingYield ? 'Rendimiento actualizado' : 'Rendimiento creado')
  }))

  return (
    <ModalGrid
      show
      title={editingYield ? 'Editar rendimiento' : 'Nuevo rendimiento'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <SelectForm
        id='type'
        label='Tipo'
        size={6}
        options={YIELD_TYPE_OPTIONS}
        optionValue='value'
        optionLabel='label'
        error={Boolean(errors.type)}
        errorText='El tipo es obligatorio'
        {...register('type', { required: true })}
      />

      <Controller
        name='accountId'
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <SelectForm
            id='accountId'
            label='Cuenta'
            size={6}
            options={accounts}
            optionValue='_id'
            optionLabel='name'
            voidOption
            error={Boolean(errors.accountId)}
            errorText='La cuenta es obligatoria'
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            inputRef={field.ref}
          />
        )}
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
                value={categories.filter((category) => category._id && field.value?.includes(category._id)) || []}
                onChange={(_, newValue) => {
                  const ids = newValue.flatMap((selectedCategory) => typeof selectedCategory === 'string' ? [selectedCategory] : (selectedCategory._id ? [selectedCategory._id] : []))
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
          {errors.categoryIds
            ? <FormHelperText error>Selecciona al menos una categoría</FormHelperText>
            : <FormHelperText>Se usan para sugerir qué movimientos enlazar a este rendimiento</FormHelperText>}
        </Stack>
      </Grid>

      {watchedType === 'cashback' && taxCategoryOptions.length > 0 && (
        <Controller
          name='taxCategoryId'
          control={control}
          render={({ field }) => (
            <SelectForm
              id='taxCategoryId'
              label='Categoría de impuesto (opcional)'
              size={12}
              options={taxCategoryOptions}
              optionValue='_id'
              optionLabel='name'
              voidOption
              voidLabel='Ninguna: todos los gastos son recibos'
              helperText='Si el cashback retiene impuesto, indica su categoría para no contarlo como recibo'
              error={false}
              errorText=''
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
      )}

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert
            severity='error'
            action={submitResult?.existingYieldId && (
              <Button
                color='inherit'
                size='small'
                onClick={() => navigate(`/rendimientos/${submitResult.existingYieldId}`)}
              >
                Ver rendimiento
              </Button>
            )}
          >
            {submitError}
          </Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default YieldForm
