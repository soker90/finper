import { Router } from 'express';
import passport from 'passport';

import loggerHandler from '../utils/logger';
import { AuthController } from '../controllers/auth.controller';
import { userService, accountService } from '../services';

import '../auth/jwt-strategy-passport-handler';

export class AuthRoutes {
  router: Router;

  public accountController: AuthController = new AuthController({
    userService,
    authService: accountService,
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

    this.router.get(
        '/me',
        passport.authenticate('jwt', { session: false }),
        this.accountController.me.bind(this.accountController)
    );
  }
}
