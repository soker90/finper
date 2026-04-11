import Joi from 'joi'
import Boom from '@hapi/boom'
import { IProperty } from '@soker90/finper-models'
import { validatePropertyExist } from './validate-property-exist'

export const validatePropertyParams = async ({ params, body, user }: { params?: Record<string, string>, body: Record<string, string>, user: string }): Promise<{ id?: string, value: IProperty }> => {
  if (params?.id) {
    await validatePropertyExist({ id: params.id, user })
  }

  const schema = Joi.object({
    name: Joi.string().required()
  })

  // Retain other keys like user so they can be added later by the controller if needed or let controller do it
  // Joi schema.validate only strips unknown if specified, otherwise it returns all if unknown allow, but wait!
  // It's better to explicitly allow unknown false and just pass what's returned.
  const { error, value } = schema.validate(body, { stripUnknown: true })

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params?.id, value: value as IProperty }
}
