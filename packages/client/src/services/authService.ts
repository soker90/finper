import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import { FINPER_TOKEN } from 'config'
import { isTokenPresent } from 'utils/isTokenPresent'

const decodeToken = (accessToken: string): { exp?: number } | null => {
  try {
    return jwtDecode(accessToken)
  } catch {
    return null
  }
}

const clearStoredSession = () => {
  localStorage.removeItem(FINPER_TOKEN)
  delete axios.defaults.headers.common.Authorization
}

class AuthService {
  setAxiosInterceptors = ({ onLogout }: { onLogout: () => void }) => {
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          this.setSession(null)
          onLogout()
        }

        return Promise.reject(error)
      }
    )
  }

  handleAuthentication = (): void => {
    const accessToken = this.getAccessToken()

    if (!accessToken) {
      this.setSession(null)
      return
    }

    if (this.isValidToken(accessToken)) {
      this.setSession(accessToken)
    } else {
      this.setSession(null)
    }
  }

  loginWithUsernameAndPassword = (username: string, password: string) => new Promise<string>((resolve, reject) => {
    axios.post('/auth/login', { username, password })
      .then(({ data }) => {
        if (data.token) {
          this.setSession(data.token)
          resolve(data.token)
        } else reject(data.error)
      })
      .catch(error => {
        reject(error?.response?.data || error)
      })
  })

  loginInWithToken = (): Promise<string> => new Promise((resolve, reject) => {
    axios.get('/auth/me')
      .then(({ headers }) => {
        if (isTokenPresent(headers.token)) {
          this.setSession(headers.token)
          resolve(headers.token)
        } else {
          const currentToken = this.getAccessToken()
          if (currentToken) {
            resolve(currentToken)
          } else {
            reject(new Error('No token available'))
          }
        }
      })
      .catch(error => {
        reject(error?.response?.data || error)
      })
  })

  logout = () => {
    this.setSession(null)
  }

  setSession = (accessToken: string | null) => {
    if (isTokenPresent(accessToken)) {
      localStorage.setItem(FINPER_TOKEN, accessToken)
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    } else {
      clearStoredSession()
    }
  }

  getAccessToken = (): string | null => {
    const storedToken = localStorage.getItem(FINPER_TOKEN)
    if (!isTokenPresent(storedToken)) {
      clearStoredSession()
      return null
    }
    return storedToken
  }

  isValidToken = (accessToken: string | null): boolean => {
    if (!isTokenPresent(accessToken)) return false

    const decodedToken = decodeToken(accessToken)
    if (!decodedToken || typeof decodedToken.exp !== 'number') return false

    const currentTimeInSeconds = Date.now() / 1000
    return decodedToken.exp > currentTimeInSeconds
  }

  isAuthenticated = (): boolean => {
    const accessToken = this.getAccessToken()
    return Boolean(accessToken && this.isValidToken(accessToken))
  }
}

const authService = new AuthService()

export default authService
