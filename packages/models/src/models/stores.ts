import {Schema, model, Document} from 'mongoose';

export interface IStore extends Document {
    name: string
}

const storeSchema = new Schema<IStore>({
    name: {type: String, required: true},
}, {versionKey: false});


export const StoreModel = model<IStore>('Store', storeSchema);
