import { model, Schema, Types, HydratedDocument } from 'mongoose'
import { TransactionType, TRANSACTION } from './transactions'
import type { BudgetRuleClassType } from '@soker90/finper-types'

export type { BudgetRuleClassType }

export const BUDGET_RULE_CLASS = {
  Needs: 'needs',
  Wants: 'wants',
  Savings: 'savings',
  None: 'none',
} as const

export interface ICategory {
  name: string
  type: TransactionType
  parent?: Types.ObjectId
  user: string
  budgetRuleClass?: BudgetRuleClassType
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
  }
}, { versionKey: false })

export const CategoryModel = model<ICategory>('Category', categorySchema)
