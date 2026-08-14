import { useState } from 'react'
import { useNavigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import authService from 'services/authService'

const CREDENTIAL_GONE_MESSAGE = 'Este dispositivo ya no tiene una huella registrada. Inicia sesión con tu contraseña.'
const DEFAULT_ERROR_MESSAGE = 'No se pudo verificar la huella. Introduce tu contraseña.'
const CANCELLED_MESSAGE = 'Operación cancelada.'

export const usePasskeyLogin = () => {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()

  const sendPasskeyLogin = (username: string) => {
    setLoading(true)
    setError('')

    authService.loginWithPasskey(username)
      .then(token => {
        setAccessToken(token)
        navigate('/')
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError') {
          setError(CANCELLED_MESSAGE)
          return
        }

        if (err?.statusCode === 404 || err?.statusCode === 401) {
          authService.forgetPasskeyDevice()
          setError(CREDENTIAL_GONE_MESSAGE)
          return
        }

        setError(DEFAULT_ERROR_MESSAGE)
      })
      .finally(() => setLoading(false))
  }

  return { sendPasskeyLogin, error, loading }
}
