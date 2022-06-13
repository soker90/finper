import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateAccountCreateParams = (input: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    bank: Joi.string().required(),
    balance: Joi.number()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
