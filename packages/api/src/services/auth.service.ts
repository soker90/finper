import jwt, { SignOptions } from 'jsonwebtoken'

import { UserModel } from '@soker90/finper-models'

export interface IAuthService {
  getSignedToken(username: string): string
}

interface JwtConfig {
  secret: string
  timeout: string  // Solo string
}

export default class AuthService implements IAuthService {
  private jwtConfig: JwtConfig

  private UserModel

  constructor (jwtConfig: Record<string, string | number>) {
    this.jwtConfig = {
      secret: jwtConfig.secret as string,
      timeout: String(jwtConfig.timeout)
    }
    this.UserModel = UserModel
  }

  getSignedToken (username: string): string {
    const { secret, timeout } = this.jwtConfig
    return jwt.sign({ username }, secret, { expiresIn: timeout } as SignOptions)
  }
}
