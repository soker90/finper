import Joi from 'joi';
import Boom from '@hapi/boom';

import {
  MIN_LENGTH_USERNAME,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
} from '../config/inputs';

export default (input: Record<string, string>) => {
  const schema = Joi.object({
    password: Joi.string().trim().min(MIN_PASSWORD_LENGTH).required(),
    username: Joi.string().lowercase().trim().min(MIN_LENGTH_USERNAME).max(MAX_USERNAME_LENGTH).required(),
  });

  const { error, value } = schema.validate(input, { convert: true });

  if (error) {
    throw Boom.badData(error.message).output;
  }

  return value;
};
