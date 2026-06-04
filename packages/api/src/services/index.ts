import TicketService from './ticket.service'
import PropertyService from './property.service'
import SupplyService from './supply.service'
import SupplyReadingService from './supply-reading.service'
import TariffsService from './tariffs.service'

export const ticketService = new TicketService()
export const propertyService = new PropertyService()
export const supplyService = new SupplyService()
export const supplyReadingService = new SupplyReadingService()
export const tariffsService = new TariffsService()
