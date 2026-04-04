import Joi from 'joi'
import Boom from '@hapi/boom'
import { DebtType, IDebt } from '@soker90/finper-models'

export const validateDebtEditParams = async ({
  params,
  body
}: { params: Record<string, string>, body: Record<string, string> }): Promise<{ id: string, value: IDebt }> => {
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
