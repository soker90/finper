import { TransactionModel } from '@soker90/finper-models'
import { notFound } from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateTransactionExist = async (id: string, user: string) => {
  const exist = await TransactionModel.exists({ _id: id, user })
  if (!exist) {
    throw notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
  }
}
