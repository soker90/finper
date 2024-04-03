/* eslint-disable class-methods-use-this */
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'
import { FINPER_TOKEN } from 'config'

class AuthService {
  setAxiosInterceptors = ({ onLogout }: { onLogout: () => void }) => {
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          this.setSession(null)

          if (onLogout) onLogout()
        }

        return Promise.reject(error)
      }
    )
  }

  handleAuthentication () {
    const accessToken = this.getAccessToken()

    if (!accessToken) return

    if (this.isValidToken(accessToken)) this.setSession(accessToken)
    else this.setSession(null)
  }

  loginWithUsernameAndPassword = (username: string, password: string) => new Promise<string>((resolve, reject) => {
    axios.post('/auth/login', { username, password })
      .then(({ data }) => {
        if (data.token) {
          this.setSession(data.token)
          resolve(data.token)
        } else reject(data.error)
      })
      .catch(({ response }) => {
        reject(response.data)
      })
  })

  loginInWithToken = (): Promise<string> => new Promise((resolve, reject) => {
    axios.get('/auth/me')
      .then(({ headers }) => {
        if (headers.token) {
          this.setSession(headers.token)
          resolve(headers.token)
        } else throw new Error()
      })
      .catch(({ response }) => {
        console.log('error', response)
        reject(response.data)
      })
  })

  logout = () => {
    this.setSession(null)
  }

  setSession = (accessToken: string | null) => {
    if (accessToken) {
      localStorage.setItem(FINPER_TOKEN, accessToken)
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`
    } else {
      localStorage.removeItem(FINPER_TOKEN)
      delete axios.defaults.headers.common.Authorization
    }
  }

  getAccessToken = (): string => localStorage.getItem(FINPER_TOKEN) as string

  isValidToken = (accessToken: string) => {
    if (!accessToken) return false

    const decoded: any = jwtDecode(accessToken)
    const currentTime = Date.now() / 1000

    return decoded.exp > currentTime
  }

  getExpireToken = (accessToken: string): number => {
    if (!accessToken) return 0

    const decoded: any = jwtDecode(accessToken)

    return decoded.exp
  }

  isAuthenticated = () => !!this.getAccessToken()
}

const authService = new AuthService()

export default authService
