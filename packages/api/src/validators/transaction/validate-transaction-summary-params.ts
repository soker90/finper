import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateTransactionSummaryParams = async (query?: Record<string, any>) => {
  const schema = Joi.object({
    months: Joi.number().integer().min(1).max(24)
  })

  const { error, value } = schema.validate(query)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
