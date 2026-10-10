import { useForm } from 'react-hook-form'
import { Alert, Box } from '@mui/material'

import { ModalGrid } from 'components'
import { SelectForm } from 'components/forms'
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
}

const PensionTransferModal = ({ sourcePlan, plans, show, onClose }: Props) => {
  const triggerMutate = usePensionPlanMutate(sourcePlan.id)
  const { error: submitError, runSubmit } = useSubmitError()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferForm>({
    defaultValues: { destinationPlanId: '' }
  })

  const destinationOptions = plans.filter(plan => plan.id !== sourcePlan.id)

  const onSubmit = handleSubmit(async ({ destinationPlanId }) => {
    const destination = plans.find(plan => plan.id === destinationPlanId)
    if (!destination) return

    const confirmed = window.confirm(
      `¿Transferir todos los activos actuales de "${sourcePlan.name}" a "${destination.name}"? El traspaso conservará el histórico y registrará el movimiento de salida y entrada con las valoraciones actuales.`
    )
    if (!confirmed) return

    await runSubmit(
      () => transferPensionAssets(sourcePlan.id, destinationPlanId),
      () => {
        triggerMutate()
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

      <Box sx={{ gridColumn: '1 / -1', width: '100%', mt: 1 }}>
        <Alert severity='info'>
          Se transferirá el valor actual completo del plan. El histórico de aportaciones no se moverá.
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
