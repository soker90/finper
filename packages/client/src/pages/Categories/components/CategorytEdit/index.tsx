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

const CategoryEdit = ({ category, hideForm, isNew }: { category: Category, hideForm: () => void, isNew?: boolean }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: category.name,
      type: category.type
      // todo paren
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
                <InputForm id='bank' label='Banco' placeholder='Nombre del banco'
                           error={!!errors.type} {...register('type', { required: true, minLength: 3 })}
                           errorText='Introduce un nombre de banco válido' />

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
