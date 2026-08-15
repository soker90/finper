import { useState } from 'react'

import {
  Button,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Switch
} from '@mui/material'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useForm } from 'react-hook-form'
import { SendLoginParams, useLogin } from './hooks/useLogin'
import { usePasskeySupport } from './hooks/usePasskeySupport'

const AuthLogin = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: '',
      usePasskey: false
    }
  })
  const {
    sendLogin,
    error,
    loading,
    awaitingPasskeyConfirmation,
    confirmPasskeyRegistration,
    skipPasskeyRegistration
  } = useLogin()
  const passkeySupported = usePasskeySupport()

  const onSubmit = handleSubmit(data => {
    sendLogin(data as SendLoginParams)
  })

  const handleClickShowPassword = () => {
    setShowPassword(state => !state)
  }

  if (awaitingPasskeyConfirmation) {
    return (
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack spacing={1}>
            <Button
              disableElevation
              fullWidth
              size='large'
              variant='contained'
              color='primary'
              data-testid='confirm-passkey-button'
              onClick={confirmPasskeyRegistration}
            >
              Activar huella ahora
            </Button>
          </Stack>
        </Grid>
        <Grid size={12}>
          <Button
            fullWidth
            variant='text'
            data-testid='skip-passkey-button'
            onClick={skipPasskeyRegistration}
          >
            Ahora no
          </Button>
        </Grid>
      </Grid>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Stack spacing={1}>
            <InputLabel htmlFor='username'>Usuario</InputLabel>
            <OutlinedInput
              id='username'
              placeholder='Introduce tu nombre de usuario'
              fullWidth
              error={!!errors.username}
              {...register('username', { required: true, minLength: 3 })}
            />
            {errors.username && (
              <FormHelperText error>
                Introduce un nombre de usuario válido
              </FormHelperText>
            )}
          </Stack>
        </Grid>
        <Grid size={12}>
          <Stack spacing={1}>
            <InputLabel htmlFor='password'>Contraseña</InputLabel>
            <OutlinedInput
              id='password'
              fullWidth
              error={!!errors.password}
              type={showPassword ? 'text' : 'password'}
              endAdornment={
                <InputAdornment position='end'>
                  <IconButton
                    aria-label='toggle password visibility'
                    onClick={handleClickShowPassword}
                    edge='end'
                    size='large'
                  >
                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </IconButton>
                </InputAdornment>
                            }
              placeholder='Introduce la contraseña'
              {...register('password', { required: true, minLength: 5 })}
            />
            {errors.password && (
              <FormHelperText error>
                Introduce una contraseña válida
              </FormHelperText>
            )}
          </Stack>
        </Grid>

        {passkeySupported && (
          <Grid size={12}>
            <FormControlLabel
              control={<Switch {...register('usePasskey')} data-testid='use-passkey-switch' />}
              label='Usar huella para próximos accesos'
            />
          </Grid>
        )}

        {error && (
          <Grid size={12}>
            <FormHelperText error>{error}</FormHelperText>
          </Grid>
        )}

        <Grid size={12}>
          <Button
            disableElevation
            disabled={loading}
            fullWidth
            size='large'
            type='submit'
            variant='contained'
            color='primary'
            data-testid='login-button'
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </Button>
        </Grid>
      </Grid>
    </form>

  )
}

export default AuthLogin
