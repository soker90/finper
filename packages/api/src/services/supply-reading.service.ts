import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'
import { supplyReadingRepository } from '../repositories/supply-reading.repository'
import { serializeReading } from '../serializers/supply-reading.serializer'

type SerializedReading = ReturnType<typeof serializeReading>

export interface ISupplyReadingService {
  addReading(reading: any): Promise<SerializedReading>
  editReading(args: { id: string, value: any, user: string }): Promise<SerializedReading>
  deleteReading(args: { id: string, user: string }): Promise<void>
  getSupplyReadings(args: { supplyId: string, user: string }): Promise<SerializedReading[]>
}

export default class SupplyReadingService implements ISupplyReadingService {
  public async getSupplyReadings ({ supplyId, user }: { supplyId: string, user: string }): Promise<SerializedReading[]> {
    return supplyReadingRepository.findBySupplyAndUser(supplyId, user).map(serializeReading)
  }

  public async addReading (reading: any): Promise<SerializedReading> {
    return serializeReading(supplyReadingRepository.create(reading))
  }

  public async editReading ({ id, value, user }: { id: string, value: any, user: string }): Promise<SerializedReading> {
    const updated = supplyReadingRepository.update(id, user, value)
    /* istanbul ignore next */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
    return serializeReading(updated)
  }

  public async deleteReading ({ id, user }: { id: string, user: string }): Promise<void> {
    const deleted = supplyReadingRepository.delete(id, user)
    /* istanbul ignore next */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.SUPPLY_READING.NOT_FOUND).output
  }
}
