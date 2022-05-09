import {NextFunction, Request, Response} from "express";
import {JwtPayload} from "jsonwebtoken";

const { AccountModel } = require('node-mongoose-models');
import errorHandlers from '../error-handlers';
const { verifyToken, signToken } = require('./auth.service');
const { ExpiredToken, InvalidToken } = require('../../errors/user.errors');

/**
 * Returns the token in the response
 * @param {Object} res
 * @param {String} username
 */
const refreshToken = (res: Response, { user }: {user: JwtPayload | string}) => {
  res.set(
    'Token', signToken(user),
  );
  res.set('Access-Control-Expose-Headers', '*, Token');
};

const handleVerifyTokenError = (res: Response) => (error: any) => {
  switch (error.name) {
  case 'TokenExpiredError':
    errorHandlers.sendUnauthorizedError(res)(new ExpiredToken());
    break;
  default:
    errorHandlers.sendUnauthorizedError(res)(error);
  }
};

/**
 * checkAuthorization
 *
 * req.headers.authorization - The value from the header Authorization: Bearer <token>
 *
 * @param {object} req
 * @param {object} res
 * @param {function} next
 */
const checkAuthorization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')?.[1];
    if (!token) throw new InvalidToken();
    const dataToken = await verifyToken(token);
    const userExist = await AccountModel?.exists({ username: dataToken?.user });
    
    if (userExist) refreshToken(res, dataToken);
    else throw new InvalidToken();

    next();
  } catch (error) {
    handleVerifyTokenError(res)(error);
  }
};

// Authentication middleware
export default checkAuthorization;
