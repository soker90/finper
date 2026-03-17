import useSWR from 'swr'
import { Ticket } from 'types'
import { TICKETS } from 'constants/api-paths'

export const useTickets = (): { tickets: Ticket[], isLoading: boolean, error: any, mutate: () => void } => {
  const { data, error, mutate } = useSWR<{ tickets: Ticket[], total: number }>(TICKETS)

  return { tickets: data?.tickets ?? [], isLoading: !data && !error, error, mutate }
}
