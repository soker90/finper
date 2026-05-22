import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid
} from '@mui/material'
import { mutate } from 'swr'

import InputForm from 'components/forms/InputForm'
import { addCategory, deleteCategory, editCategory } from 'services/apiService'
import { CATEGORIES } from 'constants/api-paths'
import './style.module.css'
import { Category } from 'types'
import { SelectForm } from 'components/forms'
import { TYPES_TRANSACTIONS_ENTRIES } from 'constants/transactions'

const CategoryEdit = ({
  rootCategories,
  category,
  hideForm,
  isNew
}: { rootCategories: Category[], category: Category, hideForm: () => void, isNew?: boolean }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const defaultValues = {
    name: category.name,
    type: category.type,
    parent: typeof category.parent === 'object' ? category.parent?._id : category.parent,
    budgetRuleClass: category.budgetRuleClass ?? 'none'
  }
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    defaultValues
  })

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change; defaultValues is rebuilt each render by design
  }, [category, reset])

  const categoryType = watch('type')
  const categoryParent = watch('parent')
  const showBudgetRule = categoryType === 'expense' && !!categoryParent
  const fieldSize = showBudgetRule ? 3 : 4

  const onSubmit = handleSubmit(async (params) => {
    const sendParams = {
      name: params.name,
      type: params.type,
      ...(params.parent && { parent: params.parent }),
      budgetRuleClass: (params.type === 'expense' && params.parent) ? params.budgetRuleClass : 'none'
    }

    const { error, data } = category._id ? await editCategory(category._id, sendParams) : await addCategory(sendParams)
    if (!error && data) {
      // @ts-ignore
      mutate(CATEGORIES, async (categories: Category[]) => {
        const mutatedCategory = {
          ...category,
          ...data,
          parent: data.parent && typeof data.parent === 'object' ? data.parent : (data.parent ? { _id: data.parent } : undefined)
        }
        if (isNew) {
          return [...categories, mutatedCategory]
        }
        return categories.map(c => c._id === category._id ? mutatedCategory : c)
      })
      hideForm()
    }
    setError(error)
  })

  const handleDeleteButton = async () => {
    if (category._id) {
      await deleteCategory(category._id)
      // @ts-ignore
      mutate(CATEGORIES, async (categories: Category[]) => {
        return categories.filter(c => c._id !== category._id)
      })
    }
    hideForm()
  }

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <InputForm
          id='name' label='Nombre' placeholder='Nombre de la categoría'
          error={!!errors.name} {...register('name', { required: true, minLength: 3 })}
          errorText='Introduce un nombre de categoría válido'
          size={fieldSize}
        />
        <SelectForm
          id='type' label='Tipo'
          error={!!errors.type} {...register('type', { required: true })}
          errorText='Introduce un tipo de gasto válido'
          options={TYPES_TRANSACTIONS_ENTRIES}
          optionValue={0}
          optionLabel={1}
          size={fieldSize}
        />
        <SelectForm
          id='parent' label='Categoría padre' placeholder='Ninguna'
          error={!!errors.parent} {...register('parent')}
          errorText='Introduce un tipo de cuenta válido'
          helperText='Solo si no es una categoría padre'
          options={[{ _id: '', name: 'Ninguna' }, ...rootCategories]}
          optionValue='_id'
          optionLabel='name'
          size={fieldSize}
        />
        {showBudgetRule && (
          <SelectForm
            id='budgetRuleClass' label='Regla 50/30/20'
            error={!!errors.budgetRuleClass} {...register('budgetRuleClass')}
            errorText='Introduce una clasificación válida'
            options={[
              { value: 'none', label: 'Ninguno (No aplica)' },
              { value: 'needs', label: 'Necesidad (50%)' },
              { value: 'wants', label: 'Deseo (30%)' },
              { value: 'savings', label: 'Ahorro / Inversión (20%)' }
            ]}
            optionValue='value'
            optionLabel='label'
            size={fieldSize}
          />
        )}

        {error && (
          <Grid size={12}>
            <FormHelperText error>{error}</FormHelperText>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Button
            disableElevation
            fullWidth
            size='large'
            variant='contained'
            color='error'
            onClick={handleDeleteButton}
            hidden={!category._id}
          >
            {isNew ? 'Cancelar' : 'Eliminar'}
          </Button>

        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Button
            disableElevation
            fullWidth
            size='large'
            type='submit'
            variant='contained'
            color='primary'
          >
            Guardar
          </Button>
        </Grid>
      </Grid>
    </form>
  )
}

export default CategoryEdit
