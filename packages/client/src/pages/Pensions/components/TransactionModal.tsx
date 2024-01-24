import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

import { ModalGrid, DateForm, InputForm } from 'components'
import { type PensionTransaction } from 'types'
import { PENSIONS } from 'constants/api-paths'

interface Props {
    show: boolean;
    onClose: () => void;
    transaction?: PensionTransaction;
    editTransaction?: (id: string, pension: PensionTransaction) => void;
    addTransaction?: (pension: PensionTransaction) => void;
}

const TransactionModal = ({ show, onClose, transaction, editTransaction, addTransaction }: Props) => {
  const { mutate } = useSWRConfig()
  const { register, handleSubmit, formState: { errors }, control } = useForm({
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
    const formattedParams = {
      date: params.date ? new Date(params.date).getTime() : null,
      value: transaction?.value,
      companyAmount: transaction?.companyAmount,
      companyUnits: transaction?.companyUnits,
      employeeAmount: transaction?.employeeAmount,
      employeeUnits: transaction?.employeeUnits
    }
    // transaction?._id ? await editTransaction(transaction._id, formattedParams as any) : await addTransaction(formattedParams as PensionTransaction)
    const error = false
    if (error) {
      await mutate(PENSIONS)
      onClose()
    }
  })

  return (
        <ModalGrid
            show={show} onClose={onClose} title='Nuevo Movimiento' action={onSubmit}>
            <DateForm placeholder={'Introduce una fecha'} id='date' label='Fecha'
                      error={!!errors.date}
                      control={control}
            />
            <InputForm id='value' label='Importe Empresa' placeholder='0'
                       error={!!errors.companyAmount} {...register('companyAmount', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
            <InputForm id='value' label='Unidades Empresa' placeholder='0'
                       error={!!errors.companyUnits} {...register('companyUnits', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
            <InputForm id='value' label='Importe Empleado' placeholder='0'
                       error={!!errors.employeeAmount} {...register('employeeAmount', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
            <InputForm id='value' label='Unidades Empleado' placeholder='0'
                       error={!!errors.employeeUnits} {...register('employeeUnits', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
            <InputForm id='value' label='Valor Unidad' placeholder='0'
                       error={!!errors.value} {...register('value', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
        </ModalGrid>
  )
}

export default TransactionModal
