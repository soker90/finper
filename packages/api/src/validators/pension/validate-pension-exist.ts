import { PensionModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validatePensionExist = async (id: string, user: string) => {
  const exist = await PensionModel.exists({ _id: id, user })

  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.PENSION.NOT_FOUND).output
  }
}
