import { Schema, model, HydratedDocument, Types } from 'mongoose'

export interface ISubscription {
  name: string
  amount: number
  currency?: string
  /** Número de meses entre pagos (ej. 1 = mensual, 3 = trimestral, 12 = anual). Máximo 60. */
  cycle: number
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
  cycle: { type: Number, required: true, min: 1, max: 60 },
  nextPaymentDate: { type: Number, default: null },
  categoryId: { type: Schema.Types.ObjectId, required: true, ref: 'Category' },
  accountId: { type: Schema.Types.ObjectId, required: true, ref: 'Account' },
  logoUrl: { type: String },
  user: { type: String, required: true }
}, { versionKey: false })

export const SubscriptionModel = model<ISubscription>('Subscription', subscriptionSchema)
