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
  destinationValue: number
  date: any
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
})
const unitsFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 6 })

const formatAmount = (amount: number) => currencyFormatter.format(amount)

const PensionTransferModal = ({ sourcePlan, plans, show, onClose }: Props) => {
  const triggerMutate = usePensionPlanMutate(sourcePlan.id)
  const { error: submitError, runSubmit } = useSubmitError()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, watch } = useForm<TransferForm>({
    defaultValues: {
      destinationPlanId: '',
      destinationUnits: 0,
      destinationValue: 0,
      date: new Date()
    }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)
  const destinationPlanId = watch('destinationPlanId')
  const destination = destinationOptions.find(plan => plan.id === destinationPlanId)
  const destinationUnits = Number(watch('destinationUnits'))
  const destinationValue = Number(watch('destinationValue'))

  const onSubmit = handleSubmit(async ({ destinationPlanId, date, destinationUnits, destinationValue }) => {
    if (!destination || sourcePlan.total <= 0 || destinationUnits <= 0 || destinationValue <= 0) return

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
      actionDisabled={isSubmitting || !destination || destinationUnits <= 0 || destinationValue <= 0 || sourcePlan.total <= 0}
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
        inputProps={{ min: 0, step: 'any' }}
        {...register('destinationUnits', {
          required: true,
          valueAsNumber: true,
          min: { value: Number.EPSILON, message: 'Introduce un número mayor que cero' },
          validate: value => Number.isFinite(value) || 'Introduce un número válido'
        })}
      />

      <InputForm
        size={12}
        id='destinationValue'
        label='Valor de la unidad en destino'
        placeholder='Valor de cada unidad'
        type='number'
        error={!!errors.destinationValue}
        errorText='Introduce un valor de unidad mayor que cero'
        inputProps={{ inputProps: { min: 0, step: 'any' } }}
        {...register('destinationValue', {
          required: true,
          valueAsNumber: true,
          min: { value: Number.EPSILON, message: 'Introduce un valor mayor que cero' },
          validate: value => Number.isFinite(value) || 'Introduce un valor válido'
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
              Se registrará un movimiento en el plan destino con <strong>{unitsFormatter.format(destinationUnits)}</strong> unidades y un valor por unidad de <strong>{formatAmount(destinationValue)}</strong>.
            </Typography>
            <Typography variant='body2' sx={{ mt: 1 }}>
              El plan de origen quedará vacío. Se conservará el histórico de aportaciones y su distribución entre empleado y empresa.
            </Typography>
          </Alert>
        </Box>
      ) : destination ? (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            Se transferirá el saldo completo de {formatAmount(sourcePlan.total)}. Introduce las unidades y el valor unitario que tendrá el movimiento en el plan destino.
          </Alert>
        </Box>
      ) : (
        <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
          <Alert severity='info'>
            Se transferirá el saldo completo del plan de origen ({formatAmount(sourcePlan.total)}). Indica las unidades y el valor unitario del movimiento que se registrará en el plan destino.
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
