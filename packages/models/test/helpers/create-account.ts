import {faker} from '@faker-js/faker';

import {AccountModel} from '../../src';

export default (params = {}) => (
    AccountModel.create({
        username: faker.internet.userName(),
        password: faker.internet.password(),
        ...params
    })
);
