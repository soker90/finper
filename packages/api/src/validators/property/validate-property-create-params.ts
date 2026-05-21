import Joi from 'joi'
import Boom from '@hapi/boom'

export const validatePropertyCreateParams = async (data: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    user: Joi.string().required()
  })

  const { error, value } = schema.validate(data, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
