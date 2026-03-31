import { Types } from 'mongoose'
import { LoanModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'

export const validateLoanExist = async ({ id, user, message }: { id: string, user: string, message?: string }) => {
  if (!Types.ObjectId.isValid(id)) {
    throw Boom.badRequest('Invalid loan id').output
  }
  const exist = await LoanModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || 'El préstamo no existe').output
  }
}
