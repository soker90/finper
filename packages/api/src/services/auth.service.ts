import jwt from 'jsonwebtoken'

import { UserModel } from '@soker90/finper-models'

export interface IAuthService {
  getSignedToken(username: string): string
}

export default class AuthService implements IAuthService {
  private jwtConfig

  private UserModel

  constructor (jwtConfig: Record<string, string | number>) {
    this.jwtConfig = jwtConfig
    this.UserModel = UserModel
  }

  getSignedToken (username: string): string {
    return jwt.sign({ username }, this.jwtConfig.secret as string, { expiresIn: this.jwtConfig.timeout })
  }
}
