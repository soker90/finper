import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateCategoryCreateParams = (input: Record<string, string>) => {
  const schema = Joi.object({
    name: Joi.string().required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
