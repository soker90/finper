import { Schema, model, HydratedDocument } from 'mongoose'

export const GOAL_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#FF9800',
  '#F44336',
  '#00BCD4',
  '#795548',
  '#607D8B',
  '#E91E63',
  '#FFC107'
] as const

export type GoalColor = typeof GOAL_COLORS[number]

export const GOAL_ICONS = [
  'DollarOutlined',
  'HomeOutlined',
  'CarOutlined',
  'LaptopOutlined',
  'HeartOutlined',
  'RocketOutlined',
  'GiftOutlined',
  'BankOutlined',
  'TrophyOutlined',
  'StarOutlined'
] as const

export type GoalIcon = typeof GOAL_ICONS[number]

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
