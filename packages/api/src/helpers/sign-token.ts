import jwt, { SignOptions } from 'jsonwebtoken'

import config from '../config'

export default (params: Record<string, unknown>): string => (
  jwt.sign(params, config.jwt.secret, { expiresIn: config.jwt.timeout } as SignOptions)
)
