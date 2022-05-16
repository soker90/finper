import { faker } from '@faker-js/faker';

import {AccountModel, IAccount} from '../../src';

export default (params?: IAccount) => (
    AccountModel.create({
        username: params?.username || faker.internet.userName(),
        password: params?.password || faker.internet.password()
    })
);
