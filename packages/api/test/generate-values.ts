import { faker } from '@faker-js/faker'
import { MAX_USERNAME_LENGTH } from '../src/config/inputs'

export const generateUsername = () => faker.internet.userName().slice(0, MAX_USERNAME_LENGTH).toLowerCase()
