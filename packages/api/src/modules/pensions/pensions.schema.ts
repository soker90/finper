import Joi from 'joi'
import Boom from '@hapi/boom'

const pensionPayloadSchema = Joi.object({
  date: Joi.number().required(),
  employeeAmount: Joi.number().required(),
  employeeUnits: Joi.number().required(),
  companyAmount: Joi.number().required(),
  companyUnits: Joi.number().required(),
  value: Joi.number().required()
})

export const validatePensionCreateParams = (body: any) => {
  const { error, value } = pensionPayloadSchema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}

export const validatePensionEditParams = (body: any) => {
  const { error, value } = pensionPayloadSchema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
