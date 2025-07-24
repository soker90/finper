import { useState } from 'react'
import { useNavigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import authService from 'services/authService'

export type SendLoginParams = {
  username: string
  password: string
}

const ERROR_MESSAGES: Record<number | string, string> = {
  401: 'Usuario o contraseña incorrectos',
  500: 'Error en el servidor',
  default: 'Error desconocido'
}

export const useLogin = () => {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()

  const handleErrors = ({ statusCode }: { statusCode: number }) => {
    const message = ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.default
    setError(message)
  }

  const sendLogin = ({ username, password }: SendLoginParams) => {
    setLoading(true)
    authService.loginWithUsernameAndPassword(username, password)
      .then((token) => {
        setAccessToken(token)
        navigate('/')
      })
      .catch(response => handleErrors(response))
      .finally(() => setLoading(false))
  }

  return {
    sendLogin,
    error,
    loading
  }
}
