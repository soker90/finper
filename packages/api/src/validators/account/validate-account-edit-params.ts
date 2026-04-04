import Joi from 'joi'
import Boom from '@hapi/boom'
import { IAccount } from '@soker90/finper-models'

export const validateAccountEditParams = async ({
  params,
  body
}: { params: Record<string, string>, body: Record<string, string> }): Promise<{ id: string, value: IAccount }> => {
  const schema = Joi.alternatives().try(
    Joi.object({
      isActive: Joi.boolean()
    }).or('balance', 'isActive'),
    Joi.object({
      name: Joi.string().required(),
      bank: Joi.string().required(),
      balance: Joi.number().required()
    })).required()

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
