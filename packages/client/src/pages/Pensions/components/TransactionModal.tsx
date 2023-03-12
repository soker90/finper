import { ModalGrid } from 'components/modals'
import { PensionTransaction } from 'types'

interface Props {
    show: boolean;
    onClose: () => void;
    transaction?: PensionTransaction;
}

const TransactionModal = ({ show, onClose, transaction }: Props) => {
  /*
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
        } = transaction?._id ? await editPension(transaction._id, formattedParams as any) : await addTransaction(formattedParams as any)
        if (!error) {
          await mutate(query)
          hideForm()
        }
        setError(error)
      })
      */
  return (
        <ModalGrid
            show={show} onClose={onClose} title='Nuevo Movimiento'>

        </ModalGrid>
  )
}

export default TransactionModal
