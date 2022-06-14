import Joi from 'joi'
import Boom from '@hapi/boom'
import { ICategory } from '@soker90/finper-models'
import { validateCategoryExist } from './validate-category-exist'

export const validateCategoryEditParams = async ({
  params,
  body
}: { params: Record<string, string>, body: Record<string, string> }): Promise<{ id: string, value: ICategory }> => {
  if (params.id) {
    await validateCategoryExist({ id: params.id })
  }

  const schema = Joi.object({
    name: Joi.string().required()
  })

  const { error, value } = schema.validate(body)

  if (error) {
    throw Boom.badData(error.message).output
  }

  return { id: params.id, value }
}
