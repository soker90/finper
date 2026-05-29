import { model, Schema, Types, HydratedDocument } from 'mongoose'
import type { TransactionType, BudgetRuleClassType, CategoryColor, CategoryIcon } from '@soker90/finper-types'
import { TRANSACTION } from './transactions'

export const CATEGORY_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#FF9800',
  '#F44336',
  '#00BCD4',
  '#795548',
  '#607D8B',
  '#E91E63',
  '#FFC107',
] as const

export const CATEGORY_ICONS = [
  'DollarOutlined',
  'HomeOutlined',
  'CarOutlined',
  'LaptopOutlined',
  'HeartOutlined',
  'RocketOutlined',
  'GiftOutlined',
  'BankOutlined',
  'TrophyOutlined',
  'StarOutlined',
] as const

export interface ICategory {
  name: string
  type: TransactionType
  parent?: Types.ObjectId
  user: string
  budgetRuleClass?: BudgetRuleClassType
  color?: CategoryColor
  icon?: CategoryIcon
}

export type CategoryDocument = HydratedDocument<ICategory>

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [TRANSACTION.Income, TRANSACTION.Expense, TRANSACTION.NotComputable]
  },
  parent: { type: Schema.Types.ObjectId, ref: 'Category' },
  user: { type: String, required: true },
  budgetRuleClass: {
    type: String,
    enum: ['needs', 'wants', 'savings', 'none'],
    default: 'none',
    required: true
  },
  color: { type: String, enum: CATEGORY_COLORS },
  icon: { type: String, enum: CATEGORY_ICONS }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
