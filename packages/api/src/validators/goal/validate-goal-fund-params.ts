import Joi from 'joi'
import Boom from '@hapi/boom'
import { validateGoalExist } from './validate-goal-exist'

export const validateGoalFundParams = async ({
  params,
  body,
  user
}: { params: Record<string, string>, body: Record<string, unknown>, user: string }): Promise<{ id: string, amount: number }> => {
  await validateGoalExist({ id: params.id, user })

  const schema = Joi.object({
    amount: Joi.number().positive().required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, amount: value.amount }
}
