import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateBudgetCopy = async ({
  body,
  user
}: {
    body: { year: number, month: number, yearOrigin: number, monthOrigin: number },
    user: string
}) => {
  const schema = Joi.object({
    year: Joi.number().min(2000).max(2100).required(),
    month: Joi.number().min(2000).max(2100).required(),
    yearOrigin: Joi.number().min(2000).max(2100).required(),
    monthOrigin: Joi.number().min(2000).max(2100).required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return {
    ...value,
    user
  }
}
