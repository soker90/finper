import {faker} from "@faker-js/faker";
import { compare } from 'bcrypt';
import {
  AccountModel,
  IAccount,
  mongoose,
} from '../../src';
import createAccount from '../helpers/create-account';

const testDatabase = require('../test-db')(mongoose);

describe('Account', () => {
  beforeAll(() => testDatabase.connect());

  afterAll(() => testDatabase.close());

  describe('when there is a new account', () => {
    const accountData = {
      username: faker.internet.userName(),
      password: faker.internet.password()
    };

    beforeAll(() => AccountModel.create(accountData));

    afterAll(() => testDatabase.clear());

    test('it should contain all the defined properties', async () => {
      const accountDocument: IAccount = await AccountModel.findOne() as IAccount;
      const isSamePassword: boolean = await compare(accountData.password, accountDocument.password);

      expect(accountDocument.username).toBe(accountData.username);
      expect(isSamePassword).toBeTruthy();
    });
  });

  describe('when there are multiple accounts', () => {
    let firstAccount: IAccount;

    beforeAll(async () => {
      firstAccount = await createAccount();

      await Promise.all([
        createAccount(),
        createAccount(),
      ]);
    });

    afterAll(() => testDatabase.clear());

    test('it should be 3 account stored', async () => {
      const accountCounter = await AccountModel.count();
      expect(accountCounter).toBe(3);
    });

    test('it should contain all the defined properties of the first account', async () => {
      const accountDocument: IAccount = await AccountModel.findOne({_id: firstAccount._id}) as IAccount;

      expect(accountDocument.username).toBe(firstAccount.username);
      expect(accountDocument.password).toBe(firstAccount.password);
    });

  });
});
