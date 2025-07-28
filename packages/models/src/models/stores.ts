import { Schema, model, Document } from 'mongoose'

export interface IStore extends Document {
  name: string,
  user: string,
}

const storeSchema = new Schema<IStore>({
  name: { type: String, required: true },
  user: { type: String, required: true }
}, {
  collation: { locale: 'es', strength: 2 },
  versionKey: false
})

export const StoreModel = model<IStore>('Store', storeSchema)
