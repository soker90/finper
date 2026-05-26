const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function test() {
  await mongoose.connect('mongodb://localhost:27018/finper-snapshots');
  const user = await mongoose.connection.collection('users').findOne({ username: 'testuser' });
  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:', user);
    console.log('Password match:', bcrypt.compareSync('testpass1234', user.password));
  }
  await mongoose.disconnect();
}
test();
