import Joi from 'joi'
import Boom from '@hapi/boom'
import { IPension } from '@soker90/finper-models'

export const validatePensionCreateParams = async (body: Omit<IPension, '_id'>) => {
  const schema = Joi.object({
    date: Joi.number().required(),
    employeeAmount: Joi.number().required(),
    employeeUnits: Joi.number().required(),
    companyAmount: Joi.number().required(),
    companyUnits: Joi.number().required(),
    value: Joi.number().required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
