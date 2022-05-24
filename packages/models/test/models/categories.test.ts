import {
    CategoryModel, ICategory,
    mongoose,
} from '../../src';
import createCategory from '../helpers/create-category';

const testDatabase = require('../test-db')(mongoose);

const testCategory = (expected: ICategory, received: ICategory) => {
    expect(expected.type).toBe(received.type);
    expect(expected.name).toBe(received.name);
};

describe('Category', () => {
    beforeAll(() => testDatabase.connect());

    afterAll(() => testDatabase.close());

    describe('when there is a new category', () => {
        let categoryData: ICategory;

        beforeAll(() => createCategory().then((category) => {
            categoryData = category;
        }));

        afterAll(() => testDatabase.clear());

        test('it should contain all the defined properties', async () => {
            const categoryDocument: ICategory = await CategoryModel.findOne() as ICategory;

            testCategory(categoryDocument, categoryData);
        });
    });

    describe('when there are multiple accounts', () => {
        let firstCategory: ICategory;

        beforeAll(async () => {
            firstCategory = await createCategory();

            await Promise.all([
                createCategory(),
                createCategory(),
            ]);
        });

        afterAll(() => testDatabase.clear());

        test('it should be 3 account stored', async () => {
            const categoryCounter = await CategoryModel.count();
            expect(categoryCounter).toBe(3);
        });

        test('it should contain all the defined properties of the first category', async () => {
            const categoryDocument: ICategory = await CategoryModel.findOne({_id: firstCategory._id}) as ICategory;

            testCategory(categoryDocument, firstCategory);
        });

    });
});
