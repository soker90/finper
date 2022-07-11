import { useState } from 'react'

import {
  Button,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack
} from '@mui/material'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useForm } from 'react-hook-form'
import { SendLoginParams, useLogin } from './hooks'

const AuthLogin = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  })
  const { sendLogin, error, loading } = useLogin()

  const onSubmit = handleSubmit(data => {
    sendLogin(data as SendLoginParams)
  })

  const handleClickShowPassword = () => {
    setShowPassword(state => !state)
  }

  return (
        <form onSubmit={onSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel htmlFor="username">Usuario</InputLabel>
                        <OutlinedInput
                            id='username'
                            placeholder="Introduce tu nombre de usuario"
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
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel htmlFor="password">Contraseña</InputLabel>
                        <OutlinedInput
                            id='password'
                            fullWidth
                            error={!!errors.password}
                            type={showPassword ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                        size="large"
                                    >
                                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                    </IconButton>
                                </InputAdornment>
                            }
                            placeholder="Introduce la contraseña"
                            {...register('password', { required: true, minLength: 5 })}
                        />
                        {errors.password && (
                            <FormHelperText error>
                                Introduce una contraseña válida
                            </FormHelperText>
                        )}
                    </Stack>
                </Grid>

                {error && (
                    <Grid item xs={12}>
                        <FormHelperText error>{error}</FormHelperText>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <Button
                        disableElevation
                        disabled={loading}
                        fullWidth
                        size="large"
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        {loading ? 'Iniciando...' : 'Iniciar sesión'}
                    </Button>
                </Grid>
            </Grid>
        </form>

  )
}

export default AuthLogin
