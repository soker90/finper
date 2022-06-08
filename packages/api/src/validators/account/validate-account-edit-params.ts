import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateAccountEditParams = (input: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string(),
    balance: Joi.string(),
    isActivate: Joi.boolean(),
    bank: Joi.string()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
