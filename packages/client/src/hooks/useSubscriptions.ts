import useSWR from 'swr'
import { Subscription, SubscriptionInput } from 'types'
import { SUBSCRIPTIONS } from 'constants/api-paths'
import { addSubscription, editSubscription, deleteSubscription } from 'services/apiService'

export const useSubscriptions = (): {
  subscriptions: Subscription[]
  isLoading: boolean
  error: any
  createSubscription: (params: SubscriptionInput) => Promise<{ error?: string }>
  updateSubscription: (id: string, params: Partial<SubscriptionInput>) => Promise<{ error?: string }>
  removeSubscription: (id: string) => Promise<{ error?: string }>
} => {
  const { data, error, mutate, isLoading } = useSWR<Subscription[]>(SUBSCRIPTIONS)

  const createSubscription = async (params: SubscriptionInput) => {
    const result = await addSubscription(params)
    if (!result.error) {
      await mutate()
    }
    return result
  }

  const updateSubscription = async (id: string, params: Partial<SubscriptionInput>) => {
    const result = await editSubscription(id, params)
    if (!result.error) {
      await mutate()
    }
    return result
  }

  const removeSubscription = async (id: string) => {
    const result = await deleteSubscription(id)
    if (!result.error) {
      await mutate(
        (current) => current?.filter((s) => s._id !== id),
        { revalidate: false }
      )
    }
    return result
  }

  return {
    subscriptions: data ?? [],
    isLoading,
    error,
    createSubscription,
    updateSubscription,
    removeSubscription
  }
}
