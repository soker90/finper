import { type ReactNode, useState } from 'react'
import { Button, FormHelperText, Grid, Stack } from '@mui/material'
import authService from 'services/authService'
import { usePasskeyLogin } from './hooks'

const PasskeyLogin = ({ children }: { children: ReactNode }) => {
  const [usePasswordInstead, setUsePasswordInstead] = useState(false)
  const { sendPasskeyLogin, error, loading } = usePasskeyLogin()

  const hasPasskey = authService.hasPasskey()
  const lastUsername = authService.getLastUsername()

  if (usePasswordInstead || !hasPasskey || !lastUsername) {
    return children
  }

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Stack spacing={1}>
          <Button
            disableElevation
            disabled={loading}
            fullWidth
            size='large'
            variant='contained'
            color='primary'
            data-testid='use-passkey-login-button'
            onClick={() => sendPasskeyLogin(lastUsername)}
          >
            {loading ? 'Verificando...' : 'Entrar con huella'}
          </Button>
        </Stack>
      </Grid>

      {error && (
        <Grid size={12}>
          <FormHelperText error>{error}</FormHelperText>
        </Grid>
      )}

      <Grid size={12}>
        <Button
          fullWidth
          variant='text'
          data-testid='use-password-instead-button'
          onClick={() => setUsePasswordInstead(true)}
        >
          Usar contraseña
        </Button>
      </Grid>
    </Grid>
  )
}

export default PasskeyLogin
