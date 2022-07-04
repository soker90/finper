import { CategoryModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  const exist = await CategoryModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  }
}
