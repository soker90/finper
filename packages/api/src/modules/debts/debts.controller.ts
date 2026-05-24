// packages/api/src/modules/debts/debts.controller.ts
import { Request, Response, NextFunction } from 'express'
import { debtsService } from './debts.service'
import { debtsSerializer } from './debts.serializer'

export const debtsController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: implementar en Sesión B
      const result = await debtsService.getAll((req.user as any).username)
      res.json(result.map(debtsSerializer.toJson))
    } catch (err) {
      next(err)
    }
  },
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: implementar en Sesión B
      const result = await debtsService.getOne(req.params.id, (req.user as any).username)
      res.json(result ? debtsSerializer.toJson(result) : null)
    } catch (err) {
      next(err)
    }
  }
}
