import Joi from 'joi'
import Boom from '@hapi/boom'
import { IAccount } from '@soker90/finper-models'
import { validateAccountExist } from './validate-account-exist'

export const validateAccountEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id: string, value: IAccount }> => {
  if (params.id) {
    await validateAccountExist(params.id, user)
  }

  const schema = Joi.object({
    name: Joi.string(),
    balance: Joi.string(),
    isActive: Joi.boolean(),
    bank: Joi.string()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
