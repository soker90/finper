import { useForm } from 'react-hook-form'
import { Alert, Box, Typography } from '@mui/material'
import { mutate } from 'swr'

import { ModalGrid, DateForm } from 'components'
import { InputForm, SelectForm } from 'components/forms'
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
  destinationUnits: number
  date: any
}

const formatAmount = (amount: number) => new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
}).format(amount)

const PensionTransferModal = ({ sourcePlan, plans, show, onClose }: Props) => {
  const triggerMutate = usePensionPlanMutate(sourcePlan.id)
  const { error: submitError, runSubmit } = useSubmitError()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch } = useForm<TransferForm>({
    defaultValues: {
      destinationPlanId: '',
      destinationUnits: 0,
      date: new Date()
    }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)
  const destinationPlanId = watch('destinationPlanId')
  const destination = destinationOptions.find(plan => plan.id === destinationPlanId)
  const destinationUnits = Number(watch('destinationUnits'))
  const destinationValue = destinationUnits > 0 ? sourcePlan.total / destinationUnits : 0

  const onSubmit = handleSubmit(async ({ destinationPlanId, date }) => {
    if (!destination || sourcePlan.total <= 0 || destinationUnits <= 0) return

    const parsedDate = date ? new Date(date).getTime() : undefined

    await runSubmit(
      () => transferPensionAssets({
        planId: sourcePlan.id,
        destinationPlanId,
        destinationUnits,
        destinationValue,
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
      title='Traspasar todos los activos'
      onClose={onClose}
      action={onSubmit}
      actionDisabled={isSubmitting || !destination || destinationUnits <= 0 || sourcePlan.total <= 0}
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

      <InputForm
        size={12}
        id='destinationUnits'
        label='Unidades en destino'
        placeholder='Número de unidades que recibirás'
        type='number'
        error={!!errors.destinationUnits}
        errorText='Introduce un número de unidades mayor que cero'
        inputProps={{ inputProps: { min: 0, step: 'any' } }}
        {...register('destinationUnits', {
          required: true,
          valueAsNumber: true,
          min: { value: Number.EPSILON, message: 'Introduce un número mayor que cero' },
          validate: value => Number.isFinite(value) || 'Introduce un número válido'
        })}
      />

      <DateForm
        size={12}
        placeholder='Fecha del traspaso'
        id='date'
        label='Fecha'
        error={!!errors.date}
        control={control}
      />

      {destination && destinationUnits > 0 && destinationValue > 0 ? (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            <Typography variant='body2'>
              Se transferirá el saldo completo de <strong>{formatAmount(sourcePlan.total)}</strong>.
              Has indicado <strong>{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 6 }).format(destinationUnits)}</strong> unidades para el destino. El valor de cada unidad será <strong>{formatAmount(destinationValue)}</strong>.
            </Typography>
            <Typography variant='body2' sx={{ mt: 1 }}>
              El plan de origen quedará vacío. Se conservará el histórico de aportaciones y su distribución entre empleado y empresa.
            </Typography>
          </Alert>
        </Box>
      ) : destination ? (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            Se transferirá el saldo completo de {formatAmount(sourcePlan.total)}. Introduce las unidades que recibirás en el plan destino y calcularemos su valor unitario.
          </Alert>
        </Box>
      ) : (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            Se transferirá el saldo completo del plan de origen ({formatAmount(sourcePlan.total)}). Indica las unidades que recibirás en el plan destino; calcularemos automáticamente su valor unitario.
          </Alert>
        </Box>
      )}

      {submitError && (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='error'>{submitError}</Alert>
        </Box>
      )}
    </ModalGrid>
  )
}

export default PensionTransferModal
