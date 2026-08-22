import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import ModalGrid from 'components/modals/ModalGrid'
import InputForm from 'components/forms/InputForm'
import SelectForm from 'components/forms/SelectForm'
import { addPensionPlan, editPensionPlan } from 'services/apiService'
import { getId } from 'utils'
import { useSubmitError } from '../hooks/useSubmitError'
import { PENSION_PLAN_COLORS } from '../constants'
import type { PensionPlan } from 'types'

const colorOptions = PENSION_PLAN_COLORS

interface PensionPlanFormValues {
  name: string
  color: string
}

interface ModalPensionPlanProps {
  open: boolean
  onClose: () => void
  pensionPlan?: PensionPlan | null
  onSuccess: () => void
}

export const ModalPensionPlan = ({ open, onClose, pensionPlan, onSuccess }: ModalPensionPlanProps) => {
  const defaultValues: PensionPlanFormValues = {
    name: pensionPlan?.name || '',
    color: pensionPlan?.color || PENSION_PLAN_COLORS[0].value
  }

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PensionPlanFormValues>({
    defaultValues
  })

  useEffect(() => {
    reset(defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reset(defaultValues) on external prop change (open/pensionPlan); defaultValues is rebuilt each render by design
  }, [reset, open, pensionPlan])

  const { error: submitError, runSubmit } = useSubmitError()

  const handleFormSubmit = handleSubmit((data) => runSubmit(async () => {
    const payload = { name: data.name.trim(), color: data.color }
    if (pensionPlan) {
      const id = getId(pensionPlan)
      if (!id) return { error: 'No se pudo identificar el plan a editar' }
      return editPensionPlan(id, payload)
    }
    return addPensionPlan(payload)
  }, () => {
    onSuccess()
    onClose()
  }))

  if (!open) return null

  return (
    <ModalGrid
      show={open}
      title={pensionPlan ? 'Editar plan de pensiones' : 'Nuevo plan de pensiones'}
      onClose={onClose}
      action={handleFormSubmit}
      actionDisabled={isSubmitting}
    >
      <InputForm
        id='name'
        label='Nombre del plan'
        placeholder='Ej. Plan de empleo, Plan BBVA'
        error={Boolean(errors.name)}
        errorText='El nombre del plan es obligatorio'
        {...register('name', { required: true })}
      />

      <SelectForm
        id='color'
        label='Color'
        error={Boolean(errors.color)}
        errorText='Selecciona un color'
        options={colorOptions}
        optionValue='value'
        optionLabel='label'
        {...register('color', { required: true })}
      />

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}
