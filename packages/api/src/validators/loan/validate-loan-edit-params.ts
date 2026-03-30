import Joi from 'joi'
import Boom from '@hapi/boom'
import { validateLoanExist } from './validate-loan-exist'
import { ILoan } from '@soker90/finper-models'

export const validateLoanEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, any>, user: string }): Promise<{ id: string, value: Partial<ILoan> }> => {
  if (params.id) {
    await validateLoanExist({ id: params.id, user })
  }

  const schema = Joi.object({
    name: Joi.string(),
    interestRate: Joi.number().min(0),
    startDate: Joi.number(),
    monthlyPayment: Joi.number().positive(),
    account: Joi.string(),
    category: Joi.string()
  })

  const { error, value } = schema.validate(body)
  if (error) throw Boom.badData(error.message).output

  return { id: params.id, value }
}
