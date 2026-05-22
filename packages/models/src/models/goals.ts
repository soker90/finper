import { Schema, model, HydratedDocument } from 'mongoose'
import { GOAL_COLORS, GOAL_ICONS, type GoalColor, type GoalIcon } from '@soker90/finper-types'

export { GOAL_COLORS, GOAL_ICONS }
export type { GoalColor, GoalIcon }

export interface IGoal {
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: Date
  color: GoalColor
  icon: GoalIcon
  user: string
}

export type GoalDocument = HydratedDocument<IGoal>

const goalSchema = new Schema<IGoal>({
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true, set: (num: number) => Math.round(num * 100) / 100 },
  currentAmount: { type: Number, default: 0, set: (num: number) => Math.round(num * 100) / 100 },
  deadline: { type: Date },
  color: { type: String, required: true, enum: GOAL_COLORS },
  icon: { type: String, required: true, enum: GOAL_ICONS },
  user: { type: String, required: true }
}, { versionKey: false })

export const GoalModel = model<IGoal>('Goal', goalSchema)
