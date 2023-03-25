import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'

import { ModalGrid } from 'components/modals'
import { PensionTransaction } from 'types'
import { PENSIONS } from 'constants/api-paths'
import InputForm from '../../Accounts/components/AccountEdit/InputForm'

interface Props {
    show: boolean;
    onClose: () => void;
    transaction?: PensionTransaction;
    editTransaction: (id: string, pension: PensionTransaction) => void;
    addTransaction: (pension: PensionTransaction) => void;
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
    const {
      error
    } = transaction?._id ? await editTransaction(transaction._id, formattedParams as any) : await addTransaction(formattedParams as PensionTransaction)
    if (!error) {
      await mutate(PENSIONS)
      onClose()
    }
  })

  return (
        <ModalGrid
            show={show} onClose={onClose} title='Nuevo Movimiento'>
            <InputForm id='value' label='Importe' placeholder='0'
                       error={!!errors.value} {...register('value', { required: true, valueAsNumber: true })}
                       errorText='Introduce un número válido'/>
        </ModalGrid>
  )
}

export default TransactionModal
