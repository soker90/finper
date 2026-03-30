import { mutate } from 'swr'
import { LOANS, LOAN_DETAIL } from 'constants/api-paths'

export const useLoanMutate = (loanId: string) => {
  const revalidate = async () => {
    await mutate(LOAN_DETAIL(loanId))
    await mutate(LOANS)
  }
  return { revalidate }
}
