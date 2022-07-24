import Joi from 'joi'
import Boom from '@hapi/boom'
import { DebtType, IDebt } from '@soker90/finper-models'
import { validateDebtExist } from './validate-debt-exist'

export const validateDebtEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id: string, value: IDebt }> => {
  if (params.id) {
    await validateDebtExist({ id: params.id, user })
  }

  const schema = Joi.object({
    from: Joi.string().required(),
    date: Joi.number(),
    amount: Joi.number().required(),
    paymentDate: Joi.number(),
    concept: Joi.string(),
    type: Joi.string().valid(DebtType.TO, DebtType.FROM).required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
