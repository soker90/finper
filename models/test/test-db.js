const mongooseOpts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = (mongoose) => {
  async function connect() {
    await mongoose.connect(__MONGO_URI__, mongooseOpts);

    mongoose.connection.on('error', (error) => {
      console.log('TEST-DB ERROR', error);
      mongoose.connect(__MONGO_URI__, mongooseOpts);
    });
  }

  async function disconnect() {
    await mongoose.connection.close();
  }

  const clean = () => mongoose.connection.db.dropDatabase();

  return {
    clean,
    connect,
    disconnect,
  };
};
