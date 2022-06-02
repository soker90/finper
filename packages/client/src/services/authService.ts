/* eslint-disable class-methods-use-this */
import jwtDecode from 'jwt-decode'
import axios from 'axios'
import { FINPER_TOKEN } from 'config'

class AuthService {
  setAxiosInterceptors = ({ onLogout }: {onLogout: () => void}) => {
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

  loginWithUsernameAndPassword = (username: string, password: string) => new Promise((resolve, reject) => {
    axios.post('/account/login', { username, password })
      .then(({ data }) => {
        if (data.token) {
          this.setSession(data.token)
          resolve(jwtDecode(data.token).username)
        } else reject(data.error)
      })
      .catch(error => {
        reject(error)
      })
  })

  loginInWithToken = () => new Promise((resolve, reject) => {
    axios.get('/account/me')
      .then(({ headers }) => {
        if (headers.token) {
          this.setSession(headers.token)
          resolve(jwtDecode(headers.token).username)
        } else reject()
      })
      .catch(error => {
        reject(error)
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

  getAccessToken = () => localStorage.getItem(FINPER_TOKEN)

  isValidToken = (accessToken: string) => {
    if (!accessToken) return false

    const decoded: any = jwtDecode(accessToken)
    const currentTime = Date.now() / 1000

    return decoded.exp > currentTime
  }

  isAuthenticated = () => !!this.getAccessToken()
}

const authService = new AuthService()

export default authService
