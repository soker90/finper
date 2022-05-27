import config from '../config';
import UserService from './user.service';
import AccountService from './account.service';

export const userService = new UserService();
export const accountService = new AccountService(config.jwt);