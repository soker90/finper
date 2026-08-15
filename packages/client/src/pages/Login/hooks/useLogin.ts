import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import authService from 'services/authService'

export type SendLoginParams = {
  username: string
  password: string
  usePasskey?: boolean
}

const ERROR_MESSAGES: Record<number | string, string> = {
  401: 'Usuario o contraseña incorrectos',
  500: 'Error en el servidor',
  default: 'Error desconocido'
}

// The browser still asks for the fingerprint (to verify identity) and only
// then discovers this device already has a credential registered for this
// account — not a real failure, the passkey was already active.
const isAlreadyRegisteredError = (err: unknown): boolean =>
  (err as { name?: string })?.name === 'InvalidStateError'

export const useLogin = () => {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [awaitingPasskeyConfirmation, setAwaitingPasskeyConfirmation] = useState<boolean>(false)
  const navigate = useNavigate()
  const { setAccessToken } = useAuth()
  const pendingUsername = useRef<string>('')
  const pendingToken = useRef<string>('')

  const handleErrors = ({ statusCode }: { statusCode: number }) => {
    const message = ERROR_MESSAGES[statusCode] || ERROR_MESSAGES.default
    setError(message)
  }

  const sendLogin = ({ username, password, usePasskey }: SendLoginParams) => {
    setLoading(true)
    authService.loginWithUsernameAndPassword(username, password)
      .then((token) => {
        if (!usePasskey) {
          setAccessToken(token)
          navigate('/')
          return
        }

        // setAccessToken is deferred on purpose: as soon as it's called,
        // GuestGuard (which wraps this page) detects hasToken()=true and
        // redirects to '/', unmounting this screen. The session is already
        // usable regardless (authService.setSession already set axios'
        // Authorization header), so registerPasskey() can call the API fine
        // while we wait.
        pendingToken.current = token
        pendingUsername.current = username

        // Direct attempt, chained off the "Iniciar sesión" tap itself: in
        // most browsers a single network hop (login -> registration-options
        // -> fingerprint) keeps the gesture "activation". If the browser
        // rejects it (lost activation or the user cancels), an explicit
        // button is offered as a last resort.
        authService.registerPasskey()
          .then(() => {
            authService.rememberPasskeyDevice(username)
            setAccessToken(token)
            navigate('/')
          })
          .catch(err => {
            if (isAlreadyRegisteredError(err)) {
              authService.rememberPasskeyDevice(username)
              setAccessToken(token)
              navigate('/')
              return
            }

            setAwaitingPasskeyConfirmation(true)
          })
      })
      .catch(response => handleErrors(response))
      .finally(() => setLoading(false))
  }

  const confirmPasskeyRegistration = () => {
    authService.registerPasskey()
      .then(() => authService.rememberPasskeyDevice(pendingUsername.current))
      .catch(err => {
        if (isAlreadyRegisteredError(err)) authService.rememberPasskeyDevice(pendingUsername.current)
      })
      .finally(() => {
        setAccessToken(pendingToken.current)
        navigate('/')
      })
  }

  const skipPasskeyRegistration = () => {
    setAccessToken(pendingToken.current)
    navigate('/')
  }

  return {
    sendLogin,
    error,
    loading,
    awaitingPasskeyConfirmation,
    confirmPasskeyRegistration,
    skipPasskeyRegistration
  }
}
