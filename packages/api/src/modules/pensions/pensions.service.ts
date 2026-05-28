import Boom from '@hapi/boom'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import { serializePension } from './pensions.serializer'

type IPensionRepository = ReturnType<typeof import('./pensions.repository').createPensionsRepository>

interface PensionsResponse {
  amount: number
  units: number
  employeeAmount: number
  companyAmount: number
  total: number
  transactions: any[]
}

export class PensionsService {
  constructor (private repository: IPensionRepository) {}

  public getPensions (user: string): PensionsResponse {
    const transactions = this.repository.findByUser(user)

    let amount = 0
    let units = 0
    let employeeAmount = 0
    let companyAmount = 0

    for (const tx of transactions) {
      employeeAmount += tx.employeeAmount
      companyAmount += tx.companyAmount
      amount += tx.employeeAmount + tx.companyAmount
      units += tx.employeeUnits + tx.companyUnits
    }

    const total = (transactions[0]?.value ?? 0) * units

    return {
      amount,
      units,
      employeeAmount,
      companyAmount,
      total,
      transactions: transactions.map(serializePension)
    }
  }

  public addPension (pension: any): any {
    const newPension = this.repository.create(pension)
    return serializePension(newPension)
  }

  public editPension ({ id, value, user }: { id: string, value: any, user: string }): any {
    if (!isValidId(id)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }

    const existing = this.repository.findById(id, user)
    if (!existing) {
      throw Boom.notFound(ERROR_MESSAGE.PENSION.NOT_FOUND).output
    }

    const updated = this.repository.update(id, user, value)
    if (!updated) {
      throw Boom.notFound(ERROR_MESSAGE.PENSION.NOT_FOUND).output
    }

    return serializePension(updated)
  }
}
