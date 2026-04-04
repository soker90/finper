import { Schema, model, HydratedDocument } from 'mongoose'

export interface IStore {
  name: string
  user: string
}

export type StoreDocument = HydratedDocument<IStore>

const storeSchema = new Schema<IStore>({
  name: { type: String, required: true },
  user: { type: String, required: true }
}, {
  collation: { locale: 'es', strength: 2 },
  versionKey: false
})

export const StoreModel = model<IStore>('Store', storeSchema)
