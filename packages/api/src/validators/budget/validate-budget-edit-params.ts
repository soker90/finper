import Joi from 'joi'
import Boom from '@hapi/boom'
import { IBudget } from '@soker90/finper-models'
import { validateCategoryExist } from '../category'
import { ERROR_MESSAGE } from '../../i18n'

export const validateBudgetEditParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, number>, user: string }): Promise<IBudget> => {
  if (params.category) {
    await validateCategoryExist({ id: params.category, user })
  }

  const schemaParams = Joi.object({
    category: Joi.string().required(),
    month: Joi.number().required(),
    year: Joi.number().required()
  })

  const { error, value } = schemaParams.validate(params)

  if (error) {
    throw Boom.badData(ERROR_MESSAGE.BUDGET.YEAR_MONTH_INVALID).output
  }

  const schemaBody = Joi.object({
    amount: Joi.number().required()
  })

  console.log(body)
  const { error: errorAmount, value: amount } = schemaBody.validate(body)

  if (errorAmount) {
    throw Boom.badData(ERROR_MESSAGE.BUDGET.INVALID_AMOUNT).output
  }

  return { ...value, ...amount, user } as IBudget
}
