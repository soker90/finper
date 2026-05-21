import Joi from 'joi'
import Boom from '@hapi/boom'
import { IStock, STOCK_TYPE } from '@soker90/finper-models'

export const validateStockCreateParams = async (body: Omit<IStock, 'user'>) => {
  const schema = Joi.object({
    ticker: Joi.string().uppercase().required(),
    name: Joi.string().required(),
    shares: Joi.number().positive().required(),
    price: Joi.number().min(0).required(),
    type: Joi.string().valid(...Object.values(STOCK_TYPE)).required(),
    date: Joi.number().required(),
    platform: Joi.string().required()
  })

  const { error, value } = schema.validate(body, { convert: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return value
}
