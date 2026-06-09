import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'
import { supplyRepository } from '../repositories/supply.repository'
import { propertyRepository } from '../repositories/property.repository'
import { supplyReadingRepository } from '../repositories/supply-reading.repository'
import { serializeSupply } from '../serializers/supply.serializer'
import { serializeProperty } from '../serializers/property.serializer'

type SerializedSupply = ReturnType<typeof serializeSupply>

export interface ISupplyService {
  addSupply(supply: any): Promise<SerializedSupply>
  editSupply(args: { id: string, value: any, user: string }): Promise<SerializedSupply>
  deleteSupply(args: { id: string, user: string }): Promise<void>
  getSuppliesGroupedByProperty(user: string): Promise<any[]>
}

export default class SupplyService implements ISupplyService {
  // Replica el $lookup viejo: propiedades del user (orden name asc) con sus supplies anidados.
  public async getSuppliesGroupedByProperty (user: string): Promise<any[]> {
    const properties = propertyRepository.findByUser(user)
    const supplies = supplyRepository.findByUser(user)
    return properties.map(p => ({
      ...serializeProperty(p),
      supplies: supplies.filter(s => s.propertyId === p.id).map(serializeSupply)
    }))
  }

  public async addSupply (supply: any): Promise<SerializedSupply> {
    return serializeSupply(supplyRepository.create(supply))
  }

  public async editSupply ({ id, value, user }: { id: string, value: any, user: string }): Promise<SerializedSupply> {
    const updated = supplyRepository.update(id, user, value)
    /* istanbul ignore next */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
    return serializeSupply(updated)
  }

  public async deleteSupply ({ id, user }: { id: string, user: string }): Promise<void> {
    supplyReadingRepository.deleteBySupplyId(id)
    const deleted = supplyRepository.delete(id, user)
    /* istanbul ignore next */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }
}
