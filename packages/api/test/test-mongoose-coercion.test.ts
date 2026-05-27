import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
});
const UserModel = mongoose.model('User', UserSchema);

const AccountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: String, required: true },
});
const AccountModel = mongoose.model('Account', AccountSchema);

describe('Mongoose coercion', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoose.set('debug', true);
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should coerce document to string when querying a string field', async () => {
    const userDoc = new UserModel({ username: 'testuser' });
    await userDoc.save();

    const accountDoc = new AccountModel({ name: 'Savings', user: 'testuser' });
    await accountDoc.save();

    // Mongoose query passing the full document to a String field!
    const results = await AccountModel.find({ user: userDoc as any });
    
    console.log('userDoc toString():', userDoc.toString());
    
    console.log('RESULTS WITH DOC:');
    console.log(results);
    
    // Check if it actually returns the doc
    expect(results.length).toBe(0); // If it coerced to _id string, it won't match 'testuser' string
    
    // Let's also test finding by passing the _id
    const resultsById = await AccountModel.find({ user: userDoc._id.toString() });
    console.log('RESULTS WITH ID:');
    console.log(resultsById);
  });
});
