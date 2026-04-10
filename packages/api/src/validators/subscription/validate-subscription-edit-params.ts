import Joi from 'joi'
import Boom from '@hapi/boom'
import { ISubscription } from '@soker90/finper-models'
import { validateCategoryExist } from '../category'
import { validateAccountExist } from '../account'
import { validateSubscriptionExist } from './validate-subscription-exist'

export const validateSubscriptionEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, any>, user: string }): Promise<{ id: string, value: Partial<ISubscription> }> => {
  await validateSubscriptionExist(params.id, user)

  const schema = Joi.object({
    name: Joi.string(),
    amount: Joi.number().positive(),
    cycle: Joi.number().integer().min(1).max(60),
    categoryId: Joi.string(),
    accountId: Joi.string(),
    logoUrl: Joi.string().uri().allow('')
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  if (body.categoryId) {
    await validateCategoryExist({ id: body.categoryId, user })
  }

  if (body.accountId) {
    await validateAccountExist(body.accountId, user)
  }

  return { id: params.id, value }
}
