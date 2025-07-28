import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

import { ModalGrid, DateForm, InputForm } from 'components'
import { type PensionTransaction } from 'types'
import { PENSIONS } from 'constants/api-paths'
import { addPensionApi, editPensionApi } from 'services/apiService'

interface Props {

  onClose: () => void;
  transaction?: PensionTransaction;
}

const TransactionModal = ({ onClose, transaction }: Props) => {
  const { mutate } = useSWRConfig()
  const { register, handleSubmit, formState: { errors }, control, setError } = useForm({
    defaultValues: {
      date: transaction?.date || null,
      value: transaction?.value || '',
      companyAmount: transaction?.companyAmount || '',
      companyUnits: transaction?.companyUnits || '',
      employeeAmount: transaction?.employeeAmount || '',
      employeeUnits: transaction?.employeeUnits || ''
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    if (!params.date) {
      setError('date', { type: 'required' })
      return
    }
    const formattedParams = {
      date: new Date(params.date).getTime(),
      value: params.value,
      companyAmount: params.companyAmount,
      companyUnits: params.companyUnits,
      employeeAmount: params.employeeAmount,
      employeeUnits: params.employeeUnits
    } as PensionTransaction

    const { error } = transaction?._id ? await editPensionApi(transaction._id, formattedParams) : await addPensionApi(formattedParams)

    if (!error) {
      await mutate(PENSIONS)
      onClose()
    }
  })

  return (
    <ModalGrid
      show onClose={onClose} title='Nuevo Movimiento' action={onSubmit}
    >
      <DateForm
        placeholder='Introduce una fecha' id='date' label='Fecha'
        error={!!errors.date}
        control={control}
      />
      <InputForm
        id='value' label='Importe Empresa' placeholder='0'
        error={!!errors.companyAmount} {...register('companyAmount', {
          required: true,
          valueAsNumber: true
        })}
        errorText='Introduce un número válido'
      />
      <InputForm
        id='value' label='Unidades Empresa' placeholder='0'
        error={!!errors.companyUnits} {...register('companyUnits', {
          required: true,
          valueAsNumber: true
        })}
        errorText='Introduce un número válido'
      />
      <InputForm
        id='value' label='Importe Empleado' placeholder='0'
        error={!!errors.employeeAmount} {...register('employeeAmount', {
          required: true,
          valueAsNumber: true
        })}
        errorText='Introduce un número válido'
      />
      <InputForm
        id='value' label='Unidades Empleado' placeholder='0'
        error={!!errors.employeeUnits} {...register('employeeUnits', {
          required: true,
          valueAsNumber: true
        })}
        errorText='Introduce un número válido'
      />
      <InputForm
        id='value' label='Valor Unidad' placeholder='0'
        error={!!errors.value} {...register('value', { required: true, valueAsNumber: true })}
        errorText='Introduce un número válido'
      />
    </ModalGrid>
  )
}

export default TransactionModal
