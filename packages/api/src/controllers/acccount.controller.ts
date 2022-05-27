/* eslint-disable @typescript-eslint/no-explicit-any */
import Boom from '@hapi/boom';
import passport from 'passport';
import { NextFunction, Request, Response } from 'express';

import signToken from '../helpers/sign-token';
import { IUserService } from '../services/user.service';
import { IAccountService } from '../services/account.service';
import validateLoginInputParams from '../validators/validate-login-input-params';
import validateRegisterInputParams from '../validators/validate-register-input-params';

import '../auth/local-strategy-passport-handler';

type IAccountController = {
  loggerHandler: any,
  userService: IUserService,
  accountService: IAccountService,
}

export class AccountController {
  private logger;

  private userService;

  private accountService;

  constructor({ loggerHandler, userService, accountService }: IAccountController) {
    this.logger = loggerHandler;
    this.userService = userService;
    this.accountService = accountService;
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ username }) => this.logger.logInfo(`/register - username: ${username && username.toLowerCase()}`))
      .then(validateRegisterInputParams)
      .then(this.accountService.createAccountIfUserAndEmailNotExist.bind(this.accountService))
      .tap(({ username }) => this.logger.logInfo(`User ${username} has been succesfully created`))
      .then(({ username }) => {
        console.log('eee')
        const token = this.accountService.getSignedToken(username);
        res.send({ token });
      })
      .catch((error) => {
        next(error);
      });
  }

  public login(req: Request, res: Response, next: NextFunction) {
    Promise.resolve(req.body)
      .tap(({ user }) => this.logger.logInfo(`/login - user: ${user && user.toLowerCase()}`))
      .then(validateLoginInputParams)
      .then(() => {
        passport.authenticate('local', function(error, user) {
          if (error) { return next(error); }

          if (!user) { return next(Boom.unauthorized().output); }

          if (!user.isAccountActive) { return next(Boom.forbidden().output); }

          const token = signToken({ username: user.username });

          res.send({ token });
        })(req, res, next);
      })
      .catch((error) => next(error));
  }
}
