import Joi from 'joi'
import Boom from '@hapi/boom'

export default (input: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    balance: Joi.string(),
    isActivate: Joi.boolean(),
    bank: Joi.string().required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
