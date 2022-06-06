import config from '../config'
import UserService from './user.service'
import AuthService from './auth.service'
import AccountService from './account.service'

export const userService = new UserService()
export const authService = new AuthService(config.jwt)
export const accountService = new AccountService()
