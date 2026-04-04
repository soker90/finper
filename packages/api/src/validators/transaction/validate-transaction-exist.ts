import { Types, TransactionModel } from '@soker90/finper-models'
import { badRequest, notFound } from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateTransactionExist = async (id: string, user: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
  }
  const exist = await TransactionModel.exists({ _id: id, user })
  if (!exist) {
    throw notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
  }
}
