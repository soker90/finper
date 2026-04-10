import Joi from 'joi'
import Boom from '@hapi/boom'
import { SUBSCRIPTION_CYCLE } from '@soker90/finper-models'
import { validateCategoryExist } from '../category'
import { validateAccountExist } from '../account'

export const validateSubscriptionCreateParams = async (params: Record<string, any>) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    amount: Joi.number().positive().required(),
    cycle: Joi.string().valid(
      SUBSCRIPTION_CYCLE.MONTHLY,
      SUBSCRIPTION_CYCLE.BIMONTHLY,
      SUBSCRIPTION_CYCLE.QUARTERLY,
      SUBSCRIPTION_CYCLE.SEMI_ANNUALLY,
      SUBSCRIPTION_CYCLE.ANNUALLY
    ).required(),
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
