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

async function run() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const userDoc = new UserModel({ username: 'testuser' });
  await userDoc.save();

  const accountDoc = new AccountModel({ name: 'Savings', user: 'testuser' });
  await accountDoc.save();

  // Mongoose query passing the full document to a String field!
  const results = await AccountModel.find({ user: userDoc });
  
  console.log('RESULTS:');
  console.log(results);

  await mongoose.disconnect();
  await mongoServer.stop();
}

run().catch(console.error);
