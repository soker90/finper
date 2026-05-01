import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateAccountTransferParams = (input: Record<string, string | number>) => {
  const schema = Joi.object({
    sourceId: Joi.string().required(),
    destinationId: Joi.string().required().invalid(Joi.ref('sourceId')),
    amount: Joi.number().positive().required()
  })

  const { error, value } = schema.validate(input)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
