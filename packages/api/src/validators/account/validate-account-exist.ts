import { Types, AccountModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateAccountExist = async (id: string, user: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const exist = await AccountModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  }
}
