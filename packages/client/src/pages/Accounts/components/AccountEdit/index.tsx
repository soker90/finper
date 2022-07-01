import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid
} from '@mui/material'
import { mutate } from 'swr'
import { Account } from 'types'

import InputForm from './InputForm'
import { addAccount, editAccount } from 'services/apiService'
import { ACCOUNTS } from 'constants/api-paths'
import './style.module.css'

const AccountEdit = ({ account, hideForm, isNew }: { account: Account, hideForm: () => void, isNew?: boolean }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: account.name,
      bank: account.bank,
      balance: account.balance
    }
  })
  const onSubmit = handleSubmit(async (params) => {
    const { error } = account._id ? await editAccount(account._id, params) : await addAccount(params)
    if (!error) {
      mutate(ACCOUNTS)
      hideForm()
    }
    setError(error)
  })

  const handleDeactivateButton = async () => {
    if (!isNew) {
      await editAccount(account._id as string, { isActive: false })
    }
    mutate(ACCOUNTS)
    hideForm()
  }

  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <InputForm id='name' label='Nombre' placeholder='Nombre de la cuenta'
                           error={!!errors.name} {...register('name', { required: true, minLength: 3 })}
                           errorText='Introduce un nombre de cuenta válido' />
                <InputForm id='bank' label='Banco' placeholder='Nombre del banco'
                           error={!!errors.bank} {...register('bank', { required: true, minLength: 3 })}
                           errorText='Introduce un nombre de banco válido' />

                <InputForm id='balance' label='Balance' placeholder='Balance'
                           error={!!errors.balance} {...register('balance', { required: true, valueAsNumber: true })}
                           errorText='Introduce un número válido' type='number' inputProps={{ step: 'any' }} />

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        variant="contained"
                        color="error"
                        onClick={handleDeactivateButton}
                        hidden={!account._id}
                    >
                        {isNew ? 'Cancelar' : 'Desactivar'}
                    </Button>

                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Guardar
                    </Button>
                </Grid>
            </Grid>
        </form>
  )
}

export default AccountEdit
