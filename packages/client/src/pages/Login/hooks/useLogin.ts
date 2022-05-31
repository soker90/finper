import { useState } from 'react'
import { API_HOST } from 'config'

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

  const handleErrors = ({ statusCode }: { statusCode: number }) => {
    const message = ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.default
    setError(message)
  }

  const sendLogin = ({ username, password }: SendLoginParams) => {
    setLoading(true)
    fetch(`${API_HOST}auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          handleErrors(res)
        } else {
          setError('')
          localStorage.setItem('token', res.token)
        }
      }).catch(error => {
        handleErrors(error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return {
    sendLogin,
    error,
    loading
  }
}
