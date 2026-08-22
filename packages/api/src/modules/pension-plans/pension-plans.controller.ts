import { Request, Response } from 'express'
import { PensionPlansService } from './pension-plans.service'
import { createPensionPlansRepository } from './pension-plans.repository'
import { db } from '../../db'
import {
  validatePlanCreateParams,
  validatePlanEditParams,
  validatePlanExist,
  validateMovementCreateParams,
  validateMovementEditParams
} from './pension-plans.validators'
import loggerHandler from '../../utils/logger'

const logger = loggerHandler('PensionPlansController')
const pensionPlansService = new PensionPlansService(createPensionPlansRepository(db))

export class PensionPlansController {
  public getPlans (req: Request, res: Response): void {
    logger.logInfo(`/pension-plans - list plans for ${req.user as string}`)
    res.send(pensionPlansService.getPlans(req.user as string))
  }

  public getPlan (req: Request, res: Response): void {
    const { id } = req.params
    logger.logInfo(`/pension-plans/${id} - get plan`)
    res.send(pensionPlansService.getPlanById(id, req.user as string))
  }

  public getAllMovements (req: Request, res: Response): void {
    logger.logInfo(`/pension-plans/movements - list movements for ${req.user as string}`)
    res.send(pensionPlansService.getAllMovements(req.user as string))
  }

  public createPlan (req: Request, res: Response): void {
    logger.logInfo('/pension-plans - create plan')
    const data = validatePlanCreateParams(req.body)
    const response = pensionPlansService.createPlan({ user: req.user as string, data })
    res.status(201).send(response)
  }

  public editPlan (req: Request, res: Response): void {
    const { id } = req.params
    logger.logInfo(`/pension-plans/${id} - edit plan`)
    const { value } = validatePlanEditParams({ params: req.params, body: req.body, user: req.user as string })
    res.send(pensionPlansService.editPlan({ id, user: req.user as string, value }))
  }

  public deletePlan (req: Request, res: Response): void {
    const { id } = req.params
    logger.logInfo(`/pension-plans/${id} - delete plan`)
    validatePlanExist({ id, user: req.user as string })
    pensionPlansService.deletePlan(id, req.user as string)
    res.status(204).send()
  }

  public getMovements (req: Request, res: Response): void {
    const { id } = req.params
    logger.logInfo(`/pension-plans/${id}/movements - list movements`)
    validatePlanExist({ id, user: req.user as string })
    res.send(pensionPlansService.getMovements(id, req.user as string))
  }

  public addMovement (req: Request, res: Response): void {
    const { id } = req.params
    logger.logInfo(`/pension-plans/${id}/movements - add movement`)
    validatePlanExist({ id, user: req.user as string })
    const data = validateMovementCreateParams(req.body)
    const response = pensionPlansService.addMovement({ planId: id, user: req.user as string, data })
    res.status(201).send(response)
  }

  public editMovement (req: Request, res: Response): void {
    const { id, movementId } = req.params
    logger.logInfo(`/pension-plans/${id}/movements/${movementId} - edit movement`)
    const value = validateMovementEditParams(req.body)
    const response = pensionPlansService.editMovement({ id: movementId, planId: id, user: req.user as string, value })
    res.send(response)
  }

  public deleteMovement (req: Request, res: Response): void {
    const { id, movementId } = req.params
    logger.logInfo(`/pension-plans/${id}/movements/${movementId} - delete movement`)
    pensionPlansService.deleteMovement({ id: movementId, planId: id, user: req.user as string })
    res.status(204).send()
  }
}

export const pensionPlansController = new PensionPlansController()
