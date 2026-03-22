import { NextFunction, Request, Response } from 'express'
import { ITicketService } from '../services/ticket.service'

type ITicketController = {
  loggerHandler: any
  ticketService: ITicketService
}

export class TicketController {
  private logger
  private ticketService

  constructor ({ loggerHandler, ticketService }: ITicketController) {
    this.logger = loggerHandler
    this.ticketService = ticketService
  }

  public async list (req: Request, res: Response, next: NextFunction): Promise<void> {
    const status = (req.query.status as string) || 'pending'

    Promise.resolve(status)
      .tap(() => this.logger.logInfo(`/tickets - list tickets status=${status}`))
      .then(s => this.ticketService.getTickets(s))
      .then(tickets => {
        res.send({ tickets, total: tickets.length })
      })
      .catch(next)
  }

  public async review (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params

    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/tickets/${id} - mark as reviewed`))
      .then(i => this.ticketService.reviewTicket(i))
      .then(() => {
        res.status(200).send({ success: true, id })
      })
      .catch(next)
  }

  public async destroy (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params

    Promise.resolve(id)
      .tap(() => this.logger.logInfo(`/tickets/${id} - delete`))
      .then(i => this.ticketService.deleteTicket(i))
      .then(() => {
        res.status(204).send()
      })
      .catch(next)
  }
}
