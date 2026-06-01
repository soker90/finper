import Joi from 'joi'

export const createParamsSchema = Joi.object({
  name: Joi.string().required(),
  bank: Joi.string().required(),
  balance: Joi.number()
})

export const editParamsSchema = Joi.alternatives().try(
  Joi.object({
    isActive: Joi.boolean()
  }).or('balance', 'isActive'),
  Joi.object({
    name: Joi.string().required(),
    bank: Joi.string().required(),
    balance: Joi.number().required()
  })
).required()

export const transferParamsSchema = Joi.object({
  sourceId: Joi.string().required(),
  destinationId: Joi.string().required().invalid(Joi.ref('sourceId')),
  amount: Joi.number().positive().required()
})
