import Boom from '@hapi/boom';

export interface CustomError extends Error {
  code: number
}
export interface HttpError extends Boom.Output {
  error: CustomError
}
