import { CategoryModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateCategoryExist = async ({ id }: { id: string }) => {
  const exist = await CategoryModel.exists({ _id: id })
  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
  }
}
