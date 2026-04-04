import { Types, DebtModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateDebtExist = async ({ id, message, user }: { id: string, message?: string, user: string }) => {
  if (!Types.ObjectId.isValid(id)) {
    throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const exist = await DebtModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || ERROR_MESSAGE.DEBT.NOT_FOUND).output
  }
}
