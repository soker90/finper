import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { mutate } from 'swr'
import { FormHelperText, Grid } from '@mui/material'

import { ModalGrid } from 'components'
import { InputForm, SelectForm } from 'components/forms'
import { Account } from 'types'
import { transferAccountMoney } from 'services/apiService'
import { ACCOUNTS } from 'constants/api-paths'

interface Props {
  accounts: Account[]
  show: boolean
  onClose: () => void
}

interface TransferForm {
  sourceId: string
  destinationId: string
  amount: number
}

const ModalTransfer = ({ accounts, show, onClose }: Props) => {
  const [error, setError] = useState<string | undefined>(undefined)

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<TransferForm>({
    defaultValues: {
      sourceId: '',
      destinationId: '',
      amount: 0
    }
  })

  const sourceId = watch('sourceId')

  const onSubmit = handleSubmit(async (params) => {
    if (params.sourceId === params.destinationId) {
      setError('La cuenta de origen y destino no pueden ser la misma')
      return
    }

    const res = await transferAccountMoney(params)

    if (res.error) {
      setError(res.error)
    } else {
      mutate(ACCOUNTS)
      reset()
      onClose()
    }
  })

  const activeAccounts = accounts
  const destinationOptions = activeAccounts.filter(a => a._id !== sourceId)

  return (
    <ModalGrid
      show={show}
      title='Traspaso entre cuentas'
      onClose={onClose}
      action={onSubmit}
    >
      <SelectForm
        size={12}
        id='sourceId' label='Cuenta Origen' placeholder='Cuenta Origen'
        error={!!errors.sourceId} {...register('sourceId', { required: true })}
        errorText='Introduce una cuenta válida'
        options={activeAccounts} optionValue='_id' optionLabel='name'
        voidOption voidLabel='Selecciona cuenta'
      />

      <SelectForm
        size={12}
        id='destinationId' label='Cuenta Destino' placeholder='Cuenta Destino'
        error={!!errors.destinationId} {...register('destinationId', { required: true })}
        errorText='Introduce una cuenta válida'
        options={destinationOptions} optionValue='_id' optionLabel='name'
        voidOption voidLabel='Selecciona cuenta'
      />

      <InputForm
        id='amount' label='Cantidad' placeholder='Cantidad a transferir' size={12}
        error={!!errors.amount} {...register('amount', { required: true, min: 0.01, valueAsNumber: true })}
        errorText='Introduce una cantidad válida mayor a 0' type='number' inputProps={{ step: 'any', min: 0.01 }}
      />

      {error && (
        <Grid size={12}>
          <FormHelperText error>{error}</FormHelperText>
        </Grid>
      )}
    </ModalGrid>
  )
}

export default ModalTransfer
