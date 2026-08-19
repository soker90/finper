import useSWR, { mutate } from 'swr'
import { PENSION_PLANS, PENSION_PLAN_DETAIL, PENSION_PLAN_MOVEMENTS } from 'constants/api-paths'
import type { PensionPlan, PensionTransaction } from 'types'

export const usePensionPlans = () => {
  const { data, error, isLoading } = useSWR<PensionPlan[]>(PENSION_PLANS)
  return {
    pensionPlans: data ?? [],
    isLoading,
    error: error as Error | undefined
  }
}

export const usePensionPlanDetail = (id?: string) => {
  const { data, error, isLoading } = useSWR<PensionPlan>(id ? PENSION_PLAN_DETAIL(id) : null)
  return {
    pensionPlan: data ?? null,
    isLoading,
    error: error as Error | undefined
  }
}

export const usePensionPlanMovements = (id?: string) => {
  const { data, error, isLoading } = useSWR<PensionTransaction[]>(id ? PENSION_PLAN_MOVEMENTS(id) : null)
  return {
    movements: data ?? [],
    isLoading,
    error: error as Error | undefined
  }
}

export const usePensionPlanMutate = (id?: string) => () => {
  mutate(PENSION_PLANS)
  if (id) {
    mutate(PENSION_PLAN_DETAIL(id))
    mutate(PENSION_PLAN_MOVEMENTS(id))
  }
}
