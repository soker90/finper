import config from '../config'
import UserService from './user.service'
import AuthService from './auth.service'

export const userService = new UserService()
export const accountService = new AuthService(config.jwt)
