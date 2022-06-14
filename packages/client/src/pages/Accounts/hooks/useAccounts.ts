import useSWR from 'swr'
import { Account } from '@soker90/finper-types'
import { ACCOUNTS } from 'constants/api-paths'

export const useAccounts = (): { accounts: Account[], isLoading: boolean, error: any } => {
  const { data, error } = useSWR(ACCOUNTS)

  return { accounts: data, isLoading: !data, error }
}
