import Boom from '@hapi/boom'
import { debtsRepository } from './debts.repository'
import { ERROR_MESSAGE } from '../../i18n'
import type { DebtRow } from './debts.serializer'
import { schema, spanishCompare } from '@soker90/finper-db'

type DebtInsert = typeof schema.debts.$inferInsert
type NewDebtInput = Omit<DebtInsert, 'id' | 'user'>
type UpdateDebtInput = Partial<NewDebtInput>

export const debtsService = {
  async addDebt (username: string, debt: NewDebtInput) {
    return debtsRepository.create(username, debt)
  },

  async editDebt (id: string, username: string, value: UpdateDebtInput) {
    const updated = await debtsRepository.update(id, username, value)
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output
    return updated
  },

  async getDebts (username: string) {
    const debts = await debtsRepository.findAllByUser(username)

    const from: DebtRow[] = []
    const to: DebtRow[] = []
    const debtsByPersonMap = new Map<string, number>()

    for (const debt of debts) {
      if (debt.type === 'from') {
        from.push(debt)
        debtsByPersonMap.set(debt.from, (debtsByPersonMap.get(debt.from) || 0) + debt.amount)
      } else if (debt.type === 'to') {
        to.push(debt)
        debtsByPersonMap.set(debt.from, (debtsByPersonMap.get(debt.from) || 0) - debt.amount)
      }
    }

    const debtsByPerson = Array.from(debtsByPersonMap.entries())
      .map(([person, total]) => ({
        _id: person,
        total
      }))
      .sort((a, b) => spanishCompare(a._id, b._id))

    return {
      from,
      to,
      debtsByPerson
    }
  },

  async getDebtsFrom (username: string, from: string) {
    return debtsRepository.findAllFromUser(username, from)
  },

  async deleteDebt (id: string, username: string) {
    const deleted = await debtsRepository.delete(id, username)
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output
  },

  async payDebt (id: string, username: string, amount: number) {
    const debt = await debtsRepository.findById(id, username)
    if (!debt) throw Boom.notFound(ERROR_MESSAGE.DEBT.NOT_FOUND).output

    const remaining = debt.amount - amount
    if (remaining <= 0) {
      await debtsRepository.delete(id, username)
      return null
    }

    return debtsRepository.update(id, username, { amount: remaining })
  }
}
