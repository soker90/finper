import type { GoalColor, GoalIcon } from '@soker90/finper-types'

export interface Goal {
  _id?: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string | null
  color: GoalColor
  icon: GoalIcon
  user?: string
}
