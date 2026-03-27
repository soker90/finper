import { LoanModel } from '@soker90/finper-models'
import Boom from '@hapi/boom'

export const validateLoanExist = async ({ id, user, message }: { id: string, user: string, message?: string }) => {
  const exist = await LoanModel.exists({ _id: id, user })
  if (!exist) {
    throw Boom.notFound(message || 'El préstamo no existe').output
  }
}
