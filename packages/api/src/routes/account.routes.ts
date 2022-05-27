import { Router } from 'express';

import loggerHandler from '../utils/logger';
import { AccountController } from '../controllers/acccount.controller';

import { userService, accountService } from '../services';

export class AccountRoutes {
  router: Router;

  public accountController: AccountController = new AccountController({
    userService,
    accountService,
    loggerHandler: loggerHandler('AccountController'),
  });    

  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.post(
      '/login',
      this.accountController.login.bind(this.accountController)
    );

    this.router.post(
      '/register',
      this.accountController.register.bind(this.accountController)
    );
  }
}