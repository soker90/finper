import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Ticket } from 'types'
import { TICKETS } from 'constants/api-paths'
import { deleteTicket, reviewTicket } from 'services/apiService'

export const useTickets = (): {
  tickets: Ticket[]
  ticketsEnabled: boolean
  isLoading: boolean
  error: any
  removeTicket: (id: string) => Promise<{ error?: string }>
  markReviewed: (id: string) => Promise<{ error?: string }>
} => {
  const [swrKey, setSwrKey] = useState<string | null>(TICKETS)
  const { data, error, mutate, isLoading } = useSWR<{ tickets: Ticket[], total: number }>(swrKey)

  useEffect(() => {
    if (error?.status === 503) {
      setSwrKey(null)
    }
  }, [error])

  const removeTicket = async (id: string) => {
    const result = await deleteTicket(id)
    if (!result.error) {
      // @ts-ignore
      await mutate(async (data: { tickets: Ticket[], total: number }) => ({
        ...data,
        tickets: data.tickets.filter(t => t.id !== id),
        total: data.total - 1
      }), { revalidate: false })
    }
    return result
  }

  const markReviewed = async (id: string) => {
    const result = await reviewTicket(id)
    if (!result.error) {
      await mutate()
    }
    return result
  }

  return {
    tickets: data?.tickets ?? [],
    ticketsEnabled: swrKey !== null,
    isLoading,
    error,
    removeTicket,
    markReviewed
  }
}
