import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  FormHelperText,
  Grid
} from '@mui/material'
import { mutate } from 'swr'

import InputForm from './InputForm'
import { editAccount } from 'services/apiService'
import { ACCOUNTS } from 'constants/api-paths'
import { Account } from '../../../../types'
import './style.module.css'

const AccountEdit = ({ account }: { account: Account }) => {
  const [error, setError] = useState<string | undefined>(undefined)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: account.name,
      bank: account.bank,
      balance: account.balance
    }
  })
  const onSubmit = handleSubmit(async (params) => {
    const { data, error } = await editAccount(account._id, params)
    if (!error) {
      mutate(ACCOUNTS)
    }
    setError(error)
  })
  const loading = false
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
                           errorText='Introduce un número válido' type='number' />

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        disabled={loading}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="error"
                    >
                        Desactivar
                    </Button>

                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        disableElevation
                        disabled={loading}
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
