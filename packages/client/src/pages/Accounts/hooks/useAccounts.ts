import useSWR from 'swr'
import { ACCOUNTS } from 'constants/api-paths'
import { Account } from '../../../types'

export const useAccounts = (): { accounts: Account[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(ACCOUNTS)

  return { accounts: data, isLoading: !data, error }
}
