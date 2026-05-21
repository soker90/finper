import Joi from 'joi'
import Boom from '@hapi/boom'

export const validateLoanSimulateParams = async (data: Record<string, any>) => {
  const schema = Joi.object({
    lumpSum: Joi.number().positive().integer().required()
  })

  const { error, value } = schema.validate(data)
  if (error) throw Boom.badData(error.message).output
  return value
}
