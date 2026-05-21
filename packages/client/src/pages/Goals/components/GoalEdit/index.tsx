import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, FormHelperText, Grid } from '@mui/material'
import { mutate } from 'swr'
import { Goal } from 'types'
import { InputForm, SelectForm } from 'components'
import { addGoal, editGoal, deleteGoal } from 'services/apiService'
import { GOALS } from 'constants/api-paths'
import { GOAL_COLORS, GOAL_ICONS } from './constants'

const colorOptions = GOAL_COLORS.map(({ value, label }) => ({ value, label }))
const iconOptions = GOAL_ICONS.map(icon => ({ value: icon, label: icon }))

interface GoalEditProps {
  goal: Goal
  hideForm: () => void
  isNew?: boolean
}

const GoalEdit = ({ goal, hideForm, isNew }: GoalEditProps) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: goal.name,
      targetAmount: goal.targetAmount,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '',
      color: goal.color,
      icon: goal.icon
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    const data = {
      ...params,
      targetAmount: Number(params.targetAmount),
      deadline: params.deadline || null
    }
    const { error: apiError } = goal._id ? await editGoal(goal._id, data) : await addGoal(data)
    if (!apiError) {
      mutate(GOALS)
      hideForm()
    }
    setError(apiError)
  })

  const handleDelete = async () => {
    if (goal._id) {
      const { error: apiError } = await deleteGoal(goal._id)
      if (!apiError) {
        mutate(GOALS)
        hideForm()
      }
      setError(apiError)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Grid
        container spacing={3} sx={{
          p: 2
        }}
      >
        <InputForm
          id='name' label='Nombre' placeholder='Nombre de la meta'
          error={!!errors.name} {...register('name', { required: true, minLength: 3 })}
          errorText='Introduce un nombre válido'
        />
        <InputForm
          id='targetAmount' label='Cantidad objetivo' placeholder='0.00'
          error={!!errors.targetAmount} {...register('targetAmount', { required: true, valueAsNumber: true, min: 0.01 })}
          errorText='Introduce una cantidad válida' type='number' inputProps={{ step: 'any' }}
        />
        <InputForm
          id='deadline' label='Fecha límite (opcional)' placeholder=''
          error={!!errors.deadline} {...register('deadline')}
          errorText='' type='date'
        />
        <SelectForm
          id='color' label='Color' error={!!errors.color}
          {...register('color', { required: true })}
          errorText='Selecciona un color'
          options={colorOptions} optionValue='value' optionLabel='label'
        />
        <SelectForm
          id='icon' label='Icono' error={!!errors.icon}
          {...register('icon', { required: true })}
          errorText='Selecciona un icono'
          options={iconOptions} optionValue='value' optionLabel='label'
        />

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
            onClick={isNew ? hideForm : handleDelete}
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

export default GoalEdit
