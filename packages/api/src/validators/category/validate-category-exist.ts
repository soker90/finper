import { Types, CategoryModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  if (!Types.ObjectId.isValid(id)) {
    throw Boom.badRequest('Invalid id').output
  }
  const exist = await CategoryModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  }
}
