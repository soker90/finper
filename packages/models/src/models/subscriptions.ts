import { Schema, model, HydratedDocument, Types } from 'mongoose'

export enum SubscriptionCycle {
  MONTHLY = 'monthly',
  BIMONTHLY = 'bimonthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi-annually',
  ANNUALLY = 'annually',
}

export interface ISubscription {
  name: string
  amount: number
  currency?: string
  cycle: SubscriptionCycle
  /** Calculado: advanceDate(ultimoPago, cycle). Null si no hay pagos registrados. */
  nextPaymentDate?: number | null
  categoryId: Types.ObjectId
  accountId: Types.ObjectId
  logoUrl?: string
  user: string
}

export type SubscriptionDocument = HydratedDocument<ISubscription>

const subscriptionSchema = new Schema<ISubscription>({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String },
  cycle: {
    type: String,
    required: true,
    enum: [
      SubscriptionCycle.MONTHLY,
      SubscriptionCycle.BIMONTHLY,
      SubscriptionCycle.QUARTERLY,
      SubscriptionCycle.SEMI_ANNUALLY,
      SubscriptionCycle.ANNUALLY,
    ]
  },
  nextPaymentDate: { type: Number, default: null },
  categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  accountId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  logoUrl: { type: String },
  user: { type: String, required: true }
}, { versionKey: false })

export const SubscriptionModel = model<ISubscription>('Subscription', subscriptionSchema)
