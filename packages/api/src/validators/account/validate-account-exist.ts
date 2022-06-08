import { AccountModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'

export const validateAccountExist = async (id: string, user: string) => {
  const exist = await AccountModel.exists({ _id: id, user })
  if (!exist) { throw Boom.notFound('La cuenta no existe').output }
}
