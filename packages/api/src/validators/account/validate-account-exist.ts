import { AccountModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export const validateAccountExist = async (id: string, user: string) => {
  const exist = await AccountModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
  }
}
