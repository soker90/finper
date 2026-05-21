import { SupplyReadingModel, ISupplyReading, SupplyReadingDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface ISupplyReadingService {
  addReading(reading: ISupplyReading): Promise<SupplyReadingDocument>
  editReading({ id, value }: { id: string, value: ISupplyReading }): Promise<SupplyReadingDocument>
  deleteReading({ id }: { id: string }): Promise<void>
  getSupplyReadings({ supplyId, user }: { supplyId: string, user: string }): Promise<SupplyReadingDocument[]>
}

export default class SupplyReadingService implements ISupplyReadingService {
  public async getSupplyReadings ({ supplyId, user }: { supplyId: string, user: string }): Promise<SupplyReadingDocument[]> {
    return SupplyReadingModel.find({ supplyId, user }).sort({ startDate: -1, endDate: -1 })
  }

  public async addReading (reading: ISupplyReading): Promise<SupplyReadingDocument> {
    return SupplyReadingModel.create(reading)
  }

  public async editReading ({ id, value }: { id: string, value: ISupplyReading }): Promise<SupplyReadingDocument> {
    const updated = await SupplyReadingModel.findByIdAndUpdate<SupplyReadingDocument>(id, value, { returnDocument: 'after' })
    /* istanbul ignore next — validator validateReadingExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
    return updated
  }

  public async deleteReading ({ id }: { id: string }): Promise<void> {
    const deleted = await SupplyReadingModel.findByIdAndDelete(id)
    /* istanbul ignore next — validator validateReadingExist runs before this method via route */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
  }
}
