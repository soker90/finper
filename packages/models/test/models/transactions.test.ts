import {
    TransactionModel, ITransaction,
    mongoose,
} from '../../src';
import createTransaction from '../helpers/create-transaction';

const testDatabase = require('../test-db')(mongoose);

const testTransactions = (expected: ITransaction, received: ITransaction) => {
    expect(expected.date).toBe(received.date);
    expect(expected.category).toBe(received.category);
    expect(expected.categoryId).toBe(received.categoryId);
    expect(expected.amount).toBe(received.amount);
    expect(expected.type).toBe(received.type);
    expect(expected.account).toBe(received.account);
    expect(expected.accountId).toBe(received.accountId);
    expect(expected.bank).toBe(received.bank);
    expect(expected.note).toBe(received.note);
    expect(expected.storeId).toBe(received.storeId);
    expect(expected.store).toBe(received.store);
};

describe('Transaction', () => {
    beforeAll(() => testDatabase.connect());

    afterAll(() => testDatabase.close());

    describe('when there is a new transaction', () => {
        let transactionData: ITransaction;

        beforeAll(() => createTransaction().then((transaction) => {
            transactionData = transaction;
        }));

        afterAll(() => testDatabase.clear());

        test('it should contain all the defined properties', async () => {
            const debtDocument: ITransaction = await TransactionModel.findOne() as ITransaction;

            testTransactions(debtDocument, transactionData);
        });
    });

    describe('when there are multiple transactions', () => {
        let firstTransaction: ITransaction;

        beforeAll(async () => {
            firstTransaction = await createTransaction();

            await Promise.all([
                createTransaction(),
                createTransaction(),
            ]);
        });

        afterAll(() => testDatabase.clear());

        test('it should be 3 transactions stored', async () => {
            const transactionsCounter = await TransactionModel.count();
            expect(transactionsCounter).toBe(3);
        });

        test('it should contain all the defined properties of the first category', async () => {
            const transactionDocument: ITransaction = await TransactionModel.findOne({_id: firstTransaction._id}) as ITransaction;

            testTransactions(transactionDocument, firstTransaction);
        });

    });
});
