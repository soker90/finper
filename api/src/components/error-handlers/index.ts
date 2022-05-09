import Boom from '@hapi/boom';
import {Response} from "express";
import LogService from '../../../api/services/log.service';

const logService = new LogService('Error');

/**
 * Send a Boom.badData error
 */
export const sendValidationError = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.badData(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}- ${payload.message}`);
  };
}

export const sendResourceFailedError = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.failedDependency(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

/**
 * Send a Boom error
 */
/* istanbul ignore next */
export const sendError = (res: Response, code: number) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.boomify(err, { statusCode: code }).output;

    payload.message = err.message || payload.message;
    payload.name = err.name || payload.error;
    res.status(statusCode).send(payload);

    const logMessage = `${payload.message || payload.error || 'Unknow error'} :`;
    console.error(logMessage, err, err.stack);
  };
}

export const sendUnauthorizedError = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.unauthorized(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

/**
 * Send a 404 not found
 */
export const sendNotFound = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.notFound(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

/**
 * Send a Boom.forbidden error
 */
export const sendForbidden = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.forbidden(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

/**
 * Send a Boom.badRequest error
 */
export const sendBadRequest = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.badRequest(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

/**
 * Send a Boom.conflict error
 */
export const sendConflict = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.conflict(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}

export const sendNotAcceptable = (res: Response) => {
  return (err: any) => {
    const { statusCode, payload } = Boom.notAcceptable(err.message).output;
    res.status(statusCode).send(payload);
    logService.logInfo(`[Error] - ${payload.message}`);
  };
}
