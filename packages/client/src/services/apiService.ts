import axios from 'axios'
import { ACCOUNTS } from 'constants/api-paths'
import { Account } from '../types'

export const editAccount = (id: string, params: { name?: string, bank?: string, balance?: number, isActive?: boolean }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.patch(`${ACCOUNTS}/${id}`, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const addAccount = (params: { name?: string, bank?: string, balance?: number }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.post(ACCOUNTS, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}