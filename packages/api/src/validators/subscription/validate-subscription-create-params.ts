import Joi from 'joi'
import Boom from '@hapi/boom'
import { validateCategoryExist } from '../category'
import { validateAccountExist } from '../account'

export const validateSubscriptionCreateParams = async (params: Record<string, any>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    amount: Joi.number().positive().required(),
    cycle: Joi.number().integer().min(1).max(60).required(),
    categoryId: Joi.string().required(),
    accountId: Joi.string().required(),
    logoUrl: Joi.string().uri().allow(''),
    user: Joi.string()
  })

  const { error, value } = schema.validate(params)

  if (error) {
    throw Boom.badData(error.message).output
  }

  await validateCategoryExist({ id: params.categoryId, user: params.user })
  await validateAccountExist(params.accountId, params.user)

  return value
}
