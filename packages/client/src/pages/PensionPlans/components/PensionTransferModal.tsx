import { useForm } from 'react-hook-form'
import { Alert, Box, Typography } from '@mui/material'
import { mutate } from 'swr'

import { ModalGrid, DateForm } from 'components'
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
      date: new Date()
    }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)
  const destinationPlanId = watch('destinationPlanId')
  const destination = destinationOptions.find(plan => plan.id === destinationPlanId)
  const destinationValue = destination && destination.units > 0
    ? destination.total / destination.units
    : 0
  const destinationUnits = destinationValue > 0
    ? sourcePlan.total / destinationValue
    : 0

  const onSubmit = handleSubmit(async ({ destinationPlanId, date }) => {
    if (!destination || destinationValue <= 0 || sourcePlan.total <= 0 || destinationUnits <= 0) return

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
      actionDisabled={isSubmitting || !destination || destinationValue <= 0 || sourcePlan.total <= 0}
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
        size={12}
        placeholder='Fecha del traspaso'
        id='date'
        label='Fecha'
        error={!!errors.date}
        control={control}
      />

      {destination && destinationValue > 0 ? (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            <Typography variant='body2'>
              Se transferirá el saldo completo de <strong>{formatAmount(sourcePlan.total)}</strong>.
              El plan destino tiene un valor de unidad de <strong>{formatAmount(destinationValue)}</strong>,
              por lo que recibirá aproximadamente <strong>{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 6 }).format(destinationUnits)}</strong> unidades.
            </Typography>
            <Typography variant='body2' sx={{ mt: 1 }}>
              El plan de origen quedará vacío. Se conservará el histórico de aportaciones y su distribución entre empleado y empresa.
            </Typography>
          </Alert>
        </Box>
      ) : destination ? (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='warning'>
            El plan de destino no tiene una valoración actual. Registra primero un movimiento con su valor de unidad para poder calcular las unidades del traspaso.
          </Alert>
        </Box>
      ) : (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            Se transferirá el saldo completo del plan de origen ({formatAmount(sourcePlan.total)}). Las unidades del plan destino se calcularán automáticamente según su última valoración.
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
