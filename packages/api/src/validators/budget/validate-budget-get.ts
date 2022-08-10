import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateBudgetGet = async (query: { year?: number, month?: number }) => {
  const schema = Joi.object({
    year: Joi.number().required(),
    month: Joi.number()
  })

  const { error, value } = schema.validate(query)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
