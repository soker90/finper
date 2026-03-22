import { faker } from '@faker-js/faker'
import { HydratedDocument } from 'mongoose'

import { UserModel, IUser } from '../../src'

export default (params = {}): Promise<HydratedDocument<IUser>> => (
  UserModel.create({
    username: faker.internet.username(),
    password: faker.internet.password(),
    ...params
  })
)
