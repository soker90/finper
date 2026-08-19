import { Request, Response } from 'express'
import { creditCardsService } from './credit-cards.service'
import {
  validateCreditCardCreateParams,
  validateCreditCardEditParams,
  validateCreditCardMovementCreateParams,
  validateCreditCardMovementEditParams,
  validateCreditCardPayDebtParams
} from './credit-cards.validators'
import { createStoresRepository } from '../stores/stores.repository'
import { StoresService } from '../stores/stores.service'
import { db } from '../../db'
import loggerHandler from '../../utils/logger'

const logger = loggerHandler('CreditCardsController')
const storesService = new StoresService(createStoresRepository(db))

// storeId travels as a free-text store name from the client (same UX as
// transactions' `store` field) and is resolved/upserted here to a real
// store id scoped to the user, reusing storesService.getAndReplaceStore.
const resolveStoreId = (storeId: string | null | undefined, user: string): string | null => {
  if (!storeId) return null
  const resolved = storesService.getAndReplaceStore({ store: storeId, user })
  return resolved.store ?? null
}

export class CreditCardsController {
  public async getCreditCards (req: Request, res: Response): Promise<void> {
    logger.logInfo(`/credit-cards - list cards for ${req.user as string}`)
    const cards = await creditCardsService.getCreditCards(req.user as string)
    res.send(cards)
  }

  public async getCreditCard (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/credit-cards/${id} - get card`)
    const card = await creditCardsService.getCreditCardById(id, req.user as string)
    res.send(card)
  }

  public async createCreditCard (req: Request, res: Response): Promise<void> {
    const data = validateCreditCardCreateParams(req.body, req.user as string)
    logger.logInfo('/credit-cards - create card')
    const card = await creditCardsService.createCreditCard({ user: req.user as string, data })
    res.status(201).send(card)
  }

  public async editCreditCard (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/credit-cards/${id} - edit card`)
    const { value } = await validateCreditCardEditParams({ params: req.params, body: req.body, user: req.user as string })
    const card = await creditCardsService.editCreditCard({ id, user: req.user as string, value })
    res.send(card)
  }

  public async deleteCreditCard (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/credit-cards/${id} - delete card`)
    await creditCardsService.deleteCreditCard(id, req.user as string)
    res.status(204).send()
  }

  public async getMovements (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const status = req.query.status as string | undefined
    logger.logInfo(`/credit-cards/${id}/movements - list movements`)
    const movements = await creditCardsService.getMovements({ creditCardId: id, user: req.user as string, status })
    res.send(movements)
  }

  public async addMovement (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/credit-cards/${id}/movements - add movement`)
    const data = validateCreditCardMovementCreateParams(req.body, req.user as string)
    await creditCardsService.getCreditCardById(id, req.user as string)
    data.storeId = resolveStoreId(data.storeId, req.user as string)
    const movement = await creditCardsService.addMovement({ creditCardId: id, user: req.user as string, data })
    res.status(201).send(movement)
  }

  public async editMovement (req: Request, res: Response): Promise<void> {
    const { id, movementId } = req.params
    logger.logInfo(`/credit-cards/${id}/movements/${movementId} - edit movement`)
    const value = validateCreditCardMovementEditParams(req.body, req.user as string)
    if (value.storeId !== undefined) {
      await creditCardsService.getCreditCardById(id, req.user as string)
      value.storeId = resolveStoreId(value.storeId, req.user as string)
    }
    const movement = await creditCardsService.editMovement({ id: movementId, creditCardId: id, user: req.user as string, value })
    res.send(movement)
  }

  public async deleteMovement (req: Request, res: Response): Promise<void> {
    const { id, movementId } = req.params
    logger.logInfo(`/credit-cards/${id}/movements/${movementId} - delete movement`)
    await creditCardsService.deleteMovement({ id: movementId, creditCardId: id, user: req.user as string })
    res.status(204).send()
  }

  public async payDebt (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/credit-cards/${id}/pay-debt - pay debt`)
    const payload = validateCreditCardPayDebtParams(req.body)
    const result = await creditCardsService.payDebt({ creditCardId: id, user: req.user as string, payload })
    res.status(200).send(result)
  }
}

export const creditCardsController = new CreditCardsController()
