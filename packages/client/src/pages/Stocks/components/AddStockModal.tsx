import { useForm } from 'react-hook-form'
import { ModalGrid, DateForm, InputForm } from 'components'
import { StockPurchase } from 'types'

interface Props {
  onClose: () => void
  onAdd: (stock: Omit<StockPurchase, '_id'>) => Promise<{ error?: string }>
}

const AddStockModal = ({ onClose, onAdd }: Props) => {
  const { register, handleSubmit, formState: { errors }, control, setError } = useForm({
    defaultValues: {
      date: null as number | null,
      ticker: '',
      name: '',
      shares: '' as unknown as number,
      price: '' as unknown as number
    }
  })

  const onSubmit = handleSubmit(async (params) => {
    if (!params.date) {
      setError('date', { type: 'required' })
      return
    }

    const payload: Omit<StockPurchase, '_id'> = {
      ticker: params.ticker.toUpperCase().trim(),
      name: params.name.trim(),
      shares: Number(params.shares),
      price: Number(params.price),
      type: 'buy',
      date: new Date(params.date).getTime()
    }

    const { error } = await onAdd(payload)
    if (!error) {
      onClose()
    }
  })

  return (
    <ModalGrid show onClose={onClose} title='Nueva compra de acciones' action={onSubmit}>
      <DateForm
        placeholder='Introduce una fecha' id='date' label='Fecha'
        error={!!errors.date}
        control={control}
        size={4}
      />
      <InputForm
        id='ticker' label='Ticker (ej: TEF.MC)' placeholder='TEF.MC'
        error={!!errors.ticker}
        {...register('ticker', { required: true })}
        errorText='Introduce el ticker de la acción'
        size={4}
      />
      <InputForm
        id='name' label='Nombre empresa' placeholder='Telefónica'
        error={!!errors.name}
        {...register('name', { required: true })}
        errorText='Introduce el nombre de la empresa'
        size={4}
      />
      <InputForm
        id='shares' label='Número de acciones' placeholder='100'
        error={!!errors.shares}
        {...register('shares', { required: true, valueAsNumber: true, min: 0.0001 })}
        errorText='Introduce un número válido'
        size={6}
      />
      <InputForm
        id='price' label='Precio por acción (€)' placeholder='4.05'
        error={!!errors.price}
        {...register('price', { required: true, valueAsNumber: true, min: 0.0001 })}
        errorText='Introduce un número válido'
        size={6}
      />
    </ModalGrid>
  )
}

export default AddStockModal
