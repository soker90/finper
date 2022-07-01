import axios from 'axios'
import { ACCOUNTS, CATEGORIES, TRANSACTIONS } from 'constants/api-paths'
import { Category, Transaction, TransactionType, Account } from 'types'

export const editAccount = (id: string, params: { name?: string, bank?: string, balance?: number, isActive?: boolean }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.patch(`${ACCOUNTS}/${id}`, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const addAccount = (params: { name?: string, bank?: string, balance?: number }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.post(ACCOUNTS, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const editCategory = (id: string, params: { name: string, type: string }): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.patch(`${CATEGORIES}/${id}`, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addCategory = (params: { name?: string, type: string, balance?: number }): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.post(CATEGORIES, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const deleteCategory = (id: string): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.delete(`${CATEGORIES}/${id}`).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addTransaction = (params: { date: string, amount: number, category: string, account: string, note?: string, type: TransactionType }): Promise<{ data?: any, error?: string }> => {
  return axios.post(`${TRANSACTIONS}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const editTransaction = (id: string, params: { date: string, amount: number, category: string, account: string, note?: string, type: TransactionType }): Promise<{ data?: any, error?: string }> => {
  return axios.put(`${TRANSACTIONS}/${id}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const deleteTransaction = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${TRANSACTIONS}/${id}`).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}
