import { faker } from '@faker-js/faker'

import { UserModel } from '../../src'

export default (params = {}) => (
  UserModel.create({
    username: faker.internet.userName(),
    password: faker.internet.password(),
    ...params
  })
)
