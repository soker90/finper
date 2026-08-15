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

// El navegador pide la huella igualmente (para comprobar la identidad) y
// solo entonces descubre que este dispositivo ya tiene una credencial
// registrada para esta cuenta — no es un fallo real, la huella ya estaba
// activada de antes.
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

        // setAccessToken se aplaza a propósito: en cuanto se llama, GuestGuard
        // (que envuelve esta página) detecta hasToken()=true y redirige a '/',
        // desmontando esta pantalla. El token de sesión ya está operativo
        // igualmente (authService.setSession ya fijó la cabecera Authorization
        // de axios), así que registerPasskey() puede llamar a la API sin
        // problema mientras esperamos.
        pendingToken.current = token
        pendingUsername.current = username

        // Intento directo, encadenado al propio toque de "Iniciar sesión":
        // en la mayoría de navegadores un solo salto de red (login ->
        // registration-options -> huella) conserva la "activación" del
        // gesto. Si el navegador lo rechaza (gesto perdido o el usuario
        // cancela), se ofrece como último recurso un botón explícito.
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
