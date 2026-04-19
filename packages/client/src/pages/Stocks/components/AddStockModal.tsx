import { useForm } from 'react-hook-form'
import { ModalGrid, DateForm, InputForm, SelectForm } from 'components'
import { StockOperationType, StockPurchase } from 'types'

interface Props {
  defaultType?: StockOperationType
  onClose: () => void
  onAdd: (stock: Omit<StockPurchase, '_id'>) => Promise<{ error?: string }>
}

const AddStockModal = ({ onClose, onAdd, defaultType = 'buy' }: Props) => {
  const isDividend = defaultType === 'dividend'

  const { register, handleSubmit, formState: { errors }, control, setError, watch } = useForm({
    defaultValues: {
      date: null as number | null,
      ticker: '',
      name: '',
      shares: '' as unknown as number,
      priceMode: 'per_share',
      price: (isDividend ? 0 : '') as unknown as number,
      platform: ''
    }
  })

  const priceMode = watch('priceMode')

  const onSubmit = handleSubmit(async (params) => {
    if (!params.date) {
      setError('date', { type: 'required' })
      return
    }

    const priceInput = Number(params.price)
    const sharesInput = Number(params.shares)

    const payload: Omit<StockPurchase, '_id'> = {
      ticker: params.ticker.toUpperCase().trim(),
      name: params.name.trim(),
      shares: sharesInput,
      price: params.priceMode === 'total' && sharesInput > 0 ? priceInput / sharesInput : priceInput,
      platform: params.platform.trim(),
      type: defaultType,
      date: new Date(params.date).getTime()
    }

    const { error } = await onAdd(payload)
    if (!error) {
      onClose()
    }
  })
  return (
    <ModalGrid show onClose={onClose} title={isDividend ? 'Nuevo dividendo de acciones' : 'Nueva compra de acciones'} action={onSubmit}>
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
        id='shares' label={isDividend ? 'Acciones recibidas' : 'Número de acciones'} placeholder='100'
        error={!!errors.shares}
        type='number'
        inputProps={{ step: 'any', min: '0' }}
        {...register('shares', { required: true, valueAsNumber: true, min: 0 })}
        errorText='Introduce un número válido'
        size={4}
      />
      <SelectForm
        id='priceMode' label='Modalidad de precio'
        error={!!errors.priceMode}
        {...register('priceMode')}
        options={[
          { label: 'Precio por acción', value: 'per_share' },
          { label: 'Precio total', value: 'total' }
        ]}
        optionLabel='label'
        optionValue='value'
        size={4}
      />
      <InputForm
        id='price' label={priceMode === 'total' ? 'Precio total (€)' : 'Precio por acción (€)'} placeholder={priceMode === 'total' ? '405' : '4.05'}
        error={!!errors.price}
        type='number'
        inputProps={{ step: 'any', min: '0' }}
        {...register('price', { required: true, valueAsNumber: true, min: 0 })}
        errorText='Introduce un número válido'
        size={4}
      />
      <InputForm
        id='platform' label='Plataforma' placeholder='DEGIRO'
        error={!!errors.platform}
        {...register('platform', { required: true })}
        errorText='Introduce la plataforma'
        size={12}
      />
    </ModalGrid>
  )
}

export default AddStockModal
