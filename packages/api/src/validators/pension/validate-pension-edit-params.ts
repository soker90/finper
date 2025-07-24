import Joi from 'joi'
import Boom from '@hapi/boom'
import { IPension } from '@soker90/finper-models'
import { validatePensionExist } from '.'

export const validatePensionEditParams = async ({ params, body, user }: {
  params: { id: string },
  body: Record<string, string>,
  user: string
}): Promise<{ id: string, value: IPension }> => {
  if (params.id) {
    await validatePensionExist(params.id, user)
  }

  const schema = Joi.object({
    date: Joi.number().required(),
    employeeAmount: Joi.number().required(),
    employeeUnits: Joi.number().required(),
    companyAmount: Joi.number().required(),
    companyUnits: Joi.number().required(),
    value: Joi.number().required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
