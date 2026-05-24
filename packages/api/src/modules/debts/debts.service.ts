// packages/api/src/modules/debts/debts.service.ts
import { debtsRepository } from './debts.repository'

export const debtsService = {
  getAll: async (username: string) => {
    // TODO: implementar en Sesión B
    return debtsRepository.findAllByUser(username)
  },
  getOne: async (id: string, username: string) => {
    // TODO: implementar en Sesión B
    return debtsRepository.findById(id, username)
  }
  // TODO: add, update, remove methods
}
