const { compare } = require('bcrypt');

const {
  createOneAccount,
  createTwoAccount,
} = require('../mocks/account');
const models = require('../..');

const fakeDatabase = require('../test-db')(models.mongoose);

const { AccountModel } = models;

describe('account', () => {
  beforeAll(() => fakeDatabase.connect());

  afterAll(() => fakeDatabase.disconnect());

  describe('Create a new account', () => {
    beforeAll(() => AccountModel.create(createOneAccount));

    afterAll(() => fakeDatabase.clean());

    test('It should contain 1 document', async () => {
      const counter = await AccountModel.countDocuments();
      expect(counter)
        .toBe(1);
    });

    test('It should contain all the properties specified in the model', async () => {
      const document = await AccountModel.findOne();

      expect(document.username)
        .toBe(createOneAccount.username);
      expect(document.password)
        .toBeDefined();
    });
  });

  describe('Create multiple accounts', () => {
    beforeAll(async () => {
      await AccountModel.create(createTwoAccount.accounts[0]);
      await AccountModel.create(createTwoAccount.accounts[1]);
    });

    afterAll(() => fakeDatabase.clean());

    test('It should contain 2 documents', async () => {
      const counter = await AccountModel.countDocuments();
      expect(counter)
        .toBe(2);
    });

    test('Check accounts created', async () => {
      const documentList = await AccountModel.find({});

      expect(documentList[0].username)
        .toBe(createTwoAccount.accounts[0].username);
      expect(compare(documentList[0].password, createTwoAccount.accounts[0].password))
        .toBeTruthy();
      expect(documentList[1].username)
        .toBe(createTwoAccount.accounts[1].username);
      expect(compare(documentList[1].password, createTwoAccount.accounts[1].password))
        .toBeTruthy();
    });

    test('Password modified', async () => {
      const document = await AccountModel.findOneAndUpdate(
        { username: createOneAccount.username },
        {
          $set: {
            password: 'passwordChanged',
          },
        },
        {
          new: true,
          upsert: true,
        });

      expect(compare(document.password, 'passwordChanged'))
        .toBeTruthy();

    });

    test('Username modified', async () => {
      const document = await AccountModel.findOneAndUpdate(
        { username: createTwoAccount.accounts[0].username },
        {
          $set: {
            username: 'usernameChanged',
          },
        },
        { new: true });

      expect(compare(document.username, 'usernameChanged'))
        .toBeTruthy();
      expect(document.username)
        .toBe('usernameChanged');
      expect(compare(document.password, createTwoAccount.accounts[0].password))
        .toBeTruthy();
    });
  });

});
