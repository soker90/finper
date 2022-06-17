import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid
} from '@mui/material'
import { mutate } from 'swr'

import InputForm from 'components/forms/InputForm'
import { addCategory, editCategory } from 'services/apiService'
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: category.name,
      type: category.type,
      parent: category.parent?._id
    }
  })
  const onSubmit = handleSubmit(async (params) => {
    const { error } = category._id ? await editCategory(category._id, params) : await addCategory(params)
    if (!error) {
      mutate(CATEGORIES)
      hideForm()
    }
    setError(error)
  })

  const handleDeactivateButton = async () => {
    hideForm()
  }

  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <InputForm id='name' label='Nombre' placeholder='Nombre de la cuenta'
                           error={!!errors.name} {...register('name', { required: true, minLength: 3 })}
                           errorText='Introduce un nombre de cuenta válido' />
                <SelectForm id='type' label='Tipo'
                            error={!!errors.type} {...register('type', { required: true })}
                            errorText='Introduce un tipo de gasto válido'
                            options={TYPES_TRANSACTIONS_ENTRIES}
                            optionValue={0}
                            optionLabel={1}
                />
                <SelectForm id='parent' label='Categoría padre' placeholder='Ninguna'
                            error={!!errors.parent} {...register('parent', { required: true })}
                            errorText='Introduce un tipo de cuenta válido'
                            helperText='Solo si no es una categoría padre'
                            options={[{ _id: '', name: 'Ninguna' }, ...rootCategories]}
                            optionValue='_id'
                            optionLabel='name'
                />

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        variant="contained"
                        color="error"
                        onClick={handleDeactivateButton}
                        hidden={!category._id}
                    >
                        {isNew ? 'Cancelar' : 'Desactivar'}
                    </Button>

                </Grid>

                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Guardar
                    </Button>
                </Grid>
            </Grid>
        </form>
  )
}

export default CategoryEdit
