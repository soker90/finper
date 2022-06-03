import axios from 'axios'
import { API_HOST, FINPER_TOKEN } from 'config'

// ========================================================
// Axios config
// ========================================================
axios.defaults.baseURL = API_HOST
axios.interceptors.response.use(
  response => {
    const { token } = response.headers
    localStorage.setItem(FINPER_TOKEN, token)
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
    return response
  }
)
