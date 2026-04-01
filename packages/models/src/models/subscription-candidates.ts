import { Schema, model, HydratedDocument, Types } from 'mongoose'

export interface ISubscriptionCandidate {
  _id?: Types.ObjectId
  transactionId: Types.ObjectId
  subscriptionIds: Types.ObjectId[]
  user: string
  createdAt: Date
}

export type SubscriptionCandidateDocument = HydratedDocument<ISubscriptionCandidate>

const subscriptionCandidateSchema = new Schema<ISubscriptionCandidate>({
  transactionId: { type: Schema.Types.ObjectId, required: true, ref: 'Transaction' },
  subscriptionIds: [{ type: Schema.Types.ObjectId, required: true, ref: 'Subscription' }],
  user: { type: String, required: true }
}, { versionKey: false, timestamps: { createdAt: true, updatedAt: false } })

export const SubscriptionCandidateModel = model<ISubscriptionCandidate>('SubscriptionCandidate', subscriptionCandidateSchema)
