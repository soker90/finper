import Joi from 'joi';
import Boom from '@hapi/boom';

export default (input: Record<string, string>) => {
  const schema = Joi.object({
    user: Joi.alternatives().try(
      Joi.string().lowercase().trim(),
      Joi.string().lowercase().email().trim(),
    ).required(),
    password: Joi.string().trim().required(),
  });

  const { error, value } = schema.validate(input);

  if (error) {
    throw Boom.badData(error.message).output;
  }

  return value;
};
