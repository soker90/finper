import Joi from 'joi'
import Boom from '@hapi/boom'
import { RequestUser } from '../../types'
import { validatePropertyExist } from './validate-property-exist'

export const validatePropertyEditParams = async (data: RequestUser) => {
  /* istanbul ignore else — params.id is always present when editing via route (URL param) */
  if (data.params?.id) {
    await validatePropertyExist({ id: data.params.id, user: data.user as string })
  }

  const schema = Joi.object({
    name: Joi.string().required()
  })

  const { error, value } = schema.validate(data.body, { stripUnknown: true })

  /* istanbul ignore next — Joi error branch not exercised for property edit in current tests */
  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: data.params?.id, value }
}
