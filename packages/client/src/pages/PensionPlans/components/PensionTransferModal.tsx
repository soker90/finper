import { useForm } from 'react-hook-form'
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
  destinationUnits: string | number
  destinationValue: string | number
}

const PensionTransferModal = ({ sourcePlan, plans, show, onClose }: Props) => {
  const triggerMutate = usePensionPlanMutate(sourcePlan.id)
  const { error: submitError, runSubmit } = useSubmitError()

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<TransferForm>({
    defaultValues: {
      destinationPlanId: '',
      date: new Date(),
      destinationUnits: '',
      destinationValue: ''
    }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)

  const onSubmit = handleSubmit(async ({ destinationPlanId, date, destinationUnits, destinationValue }) => {
    const destination = plans.find(plan => plan.id === destinationPlanId)
    if (!destination) return

    const parsedDate = date ? new Date(date).getTime() : undefined
    const parsedUnits = Number(destinationUnits)
    const parsedValue = Number(destinationValue)

    await runSubmit(
      () => transferPensionAssets({
        planId: sourcePlan.id,
        destinationPlanId,
        destinationUnits: parsedUnits,
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
        id='destinationUnits'
        label='Unidades en destino'
        placeholder='Número de unidades recibidas'
        error={!!errors.destinationUnits}
        {...register('destinationUnits', {
          required: 'Indica las unidades que recibes',
          validate: (val) => (Number.isFinite(Number(val)) && Number(val) > 0) || 'Introduce un número de unidades mayor que 0'
        })}
        errorText={errors.destinationUnits?.message || 'Introduce las unidades de destino'}
      />

      <InputForm
        size={6}
        id='destinationValue'
        label='Valor unidad destino'
        placeholder='Valor de cada unidad'
        error={!!errors.destinationValue}
        {...register('destinationValue', {
          required: 'Indica el valor de cada unidad',
          validate: (val) => (Number.isFinite(Number(val)) && Number(val) > 0) || 'Introduce un valor mayor que 0'
        })}
        errorText={errors.destinationValue?.message || 'Introduce el valor de cada unidad'}
      />

      <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
        <Alert severity='info'>
          Se trasladará el saldo completo del plan ({sourcePlan.total.toFixed(2)} €) al destino en un único movimiento. Indica las unidades que recibes y el valor de cada unidad en el destino; se registrarán exactamente esos datos. El histórico del origen se consolidará y el plan quedará vacío. Se mantendrán los importes acumulados del empleado y de la empresa.
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
