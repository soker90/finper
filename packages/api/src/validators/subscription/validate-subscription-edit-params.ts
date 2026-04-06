import Joi from 'joi'
import Boom from '@hapi/boom'
import { SubscriptionCycle } from '@soker90/finper-models'
import { validateCategoryExist } from '../category'
import { validateAccountExist } from '../account'

export const validateSubscriptionEditParams = async (params: Record<string, any>): Promise<{ id: string, value: Record<string, any> }> => {
  const schema = Joi.object({
    name: Joi.string(),
    amount: Joi.number().positive(),
    cycle: Joi.string().valid(
      SubscriptionCycle.DAILY,
      SubscriptionCycle.WEEKLY,
      SubscriptionCycle.MONTHLY,
      SubscriptionCycle.QUARTERLY,
      SubscriptionCycle.SEMI_ANNUALLY,
      SubscriptionCycle.ANNUALLY
    ),
    categoryId: Joi.string(),
    accountId: Joi.string(),
    logoUrl: Joi.string().uri().allow(''),
    id: Joi.string(),
    user: Joi.string()
  })

  const { error, value } = schema.validate(params)

  if (error) {
    throw Boom.badData(error.message).output
  }

  if (params.categoryId) {
    await validateCategoryExist({ id: params.categoryId, user: params.user })
  }

  if (params.accountId) {
    await validateAccountExist(params.accountId, params.user)
  }

  const { id, user: _user, ...rest } = value // eslint-disable-line @typescript-eslint/no-unused-vars
  return { id, value: rest }
}
