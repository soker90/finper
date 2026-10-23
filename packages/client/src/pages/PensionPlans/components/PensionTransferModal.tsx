import { useForm, useWatch } from 'react-hook-form'
import { Alert, Box } from '@mui/material'
import { mutate } from 'swr'

import { ModalGrid, DateForm, InputForm } from 'components'
import { SelectForm } from 'components/forms'
import { PENSION_PLAN_DETAIL, PENSION_PLAN_MOVEMENTS } from 'constants/api-paths'
import type { PensionPlan } from 'types'
import { transferPensionAssets } from 'services/apiService'
import { usePensionPlanMutate } from '../hooks/usePensionPlans'
import { useSubmitError } from '../hooks/useSubmitError'

interface Props {
  sourcePlan: PensionPlan
  plans: PensionPlan[]
  show: boolean
  onClose: () => void
}

interface TransferForm {
  destinationPlanId: string
  date: any
  destinationValue: string | number
}

const PensionTransferModal = ({ sourcePlan, plans, show, onClose }: Props) => {
  const triggerMutate = usePensionPlanMutate(sourcePlan.id)
  const { error: submitError, runSubmit } = useSubmitError()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<TransferForm>({
    defaultValues: {
      destinationPlanId: '',
      date: new Date(),
      destinationValue: ''
    }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)
  const selectedDestinationId = useWatch({ control, name: 'destinationPlanId' })
  const selectedDestinationPlan = plans.find(plan => plan.id === selectedDestinationId)
  const isDestinationWithoutValuation = selectedDestinationPlan && (selectedDestinationPlan.units ?? 0) <= 0
  const currentNav = selectedDestinationPlan && selectedDestinationPlan.units > 0
    ? selectedDestinationPlan.total / selectedDestinationPlan.units
    : null

  const onSubmit = handleSubmit(async ({ destinationPlanId, date, destinationValue }) => {
    const destination = plans.find(plan => plan.id === destinationPlanId)
    if (!destination) return

    const parsedDate = date ? new Date(date).getTime() : undefined
    const parsedValue = destinationValue ? Number(destinationValue) : undefined

    await runSubmit(
      () => transferPensionAssets({
        planId: sourcePlan.id,
        destinationPlanId,
        destinationValue: parsedValue,
        date: parsedDate
      }),
      () => {
        triggerMutate()
        mutate(PENSION_PLAN_DETAIL(destinationPlanId))
        mutate(PENSION_PLAN_MOVEMENTS(destinationPlanId))
        reset()
        onClose()
      }
    )
  })

  return (
    <ModalGrid
      show={show}
      title='Traspasar activos'
      onClose={onClose}
      action={onSubmit}
      actionDisabled={isSubmitting}
    >
      <SelectForm
        size={12}
        id='destinationPlanId'
        label='Plan destino'
        placeholder='Plan destino'
        error={!!errors.destinationPlanId}
        {...register('destinationPlanId', { required: true })}
        errorText='Selecciona un plan de destino'
        options={destinationOptions}
        optionValue='id'
        optionLabel='name'
        voidOption
        voidLabel='Selecciona plan'
      />

      <DateForm
        size={6}
        placeholder='Fecha del traspaso'
        id='date'
        label='Fecha'
        error={!!errors.date}
        control={control}
      />

      <InputForm
        size={6}
        id='destinationValue'
        label={isDestinationWithoutValuation ? 'Valor unidad destino (requerido)' : 'Valor unidad destino (opcional)'}
        placeholder={currentNav ? currentNav.toFixed(2) : '0'}
        error={!!errors.destinationValue}
        {...register('destinationValue', {
          required: Boolean(isDestinationWithoutValuation),
          validate: (val) => {
            if (!val) return true
            const num = Number(val)
            return (!isNaN(num) && num > 0) || 'Introduce un valor mayor que 0'
          }
        })}
        errorText={errors.destinationValue?.message || 'Introduce un valor de unidad mayor que 0'}
      />

      <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
        <Alert severity='info'>
          Se transferirá el valor actual completo del plan ({sourcePlan.total.toFixed(2)} €). El histórico de aportaciones se conservará en el plan de origen.
        </Alert>
      </Box>

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default PensionTransferModal
