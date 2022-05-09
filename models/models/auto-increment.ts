import {Schema, model, Model} from 'mongoose';

const AutoIncrementSchema = new Schema({
  seq: { type: Number, default: 1 },
  name: { type: String, required: true },
});

/* istanbul ignore next */
/**
 * Create a new document initializing the value of seq to 1 or
 * increment that value if the document exists
 */
async function getCounter(this: Model<any, any, any, any>, counterName: string) {
  const document = await this.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return document.seq;
}

AutoIncrementSchema.static('increment', getCounter);

/* istanbul ignore next */
/**
 * Decrement counter
 * @param {string} counterName
 * @return {Promise<*>}
 */
async function decreaseCounter(this: Model<any, any, any, any>, counterName: string) {
  const document = await this.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: -1 } },
  );

  return document.seq;
}

AutoIncrementSchema.static('decrease', decreaseCounter);

const modelName = 'AutoIncrement';

export default model(modelName, AutoIncrementSchema, modelName);
