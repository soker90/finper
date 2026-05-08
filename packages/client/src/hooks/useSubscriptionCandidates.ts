import useSWR from 'swr'
import { SubscriptionCandidate } from 'types'
import { SUBSCRIPTION_CANDIDATES } from 'constants/api-paths'
import { assignSubscriptionCandidate, dismissSubscriptionCandidate } from 'services/apiService'

export const useSubscriptionCandidates = (): {
  candidates: SubscriptionCandidate[]
  isLoading: boolean
  error: any
  assign: (candidateId: string, subscriptionId: string) => Promise<{ error?: string }>
  dismiss: (candidateId: string) => Promise<{ error?: string }>
} => {
  const { data, error, mutate, isLoading } = useSWR<SubscriptionCandidate[]>(SUBSCRIPTION_CANDIDATES)

  const removeFromCache = (candidateId: string) =>
    mutate(
      (current) => current?.filter((c) => c._id !== candidateId),
      { revalidate: false }
    )

  const assign = async (candidateId: string, subscriptionId: string) => {
    const result = await assignSubscriptionCandidate(candidateId, subscriptionId)
    if (!result.error) {
      await removeFromCache(candidateId)
    }
    return result
  }

  const dismiss = async (candidateId: string) => {
    const result = await dismissSubscriptionCandidate(candidateId)
    if (!result.error) {
      await removeFromCache(candidateId)
    }
    return result
  }

  return {
    candidates: data ?? [],
    isLoading,
    error,
    assign,
    dismiss
  }
}
