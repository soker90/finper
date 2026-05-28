import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import hashPassword from '../../helpers/hash-password'
import bcrypt from 'bcrypt'
import jwt, { SignOptions } from 'jsonwebtoken'
import config from '../../config'
import { createUsersRepository, usersRepository } from './users.repository'

export type AuthenticatedUser = { username: string }

export const createUsersService = (repo: ReturnType<typeof createUsersRepository>) => ({
  createUser: async ({ username, password }: Record<string, string>) => {
    const exists = repo.existsByUsername(username)
    if (exists) {
      throw Boom.conflict(ERROR_MESSAGE.USER.ALREADY_EXISTS).output
    }

    const passwordHash = hashPassword(password)
    const created = repo.create({ username, passwordHash })

    return { username, _id: created.id }
  },
  findByUsername: (username: string) => {
    return repo.findByUsername(username)
  },
  validatePassword: (passwordPlain: string, passwordHash: string) => {
    return bcrypt.compareSync(passwordPlain, passwordHash)
  },
  signToken: (username: string) => {
    return jwt.sign({ username }, config.jwt.secret, { expiresIn: String(config.jwt.timeout) } as SignOptions)
  }
})

export const usersService = createUsersService(usersRepository)
