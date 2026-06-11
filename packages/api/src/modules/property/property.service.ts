import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import { propertyRepository } from './property.repository'
import { supplyRepository } from '../supply/supply.repository'
import { supplyReadingRepository } from '../supply-reading/supply-reading.repository'
import { serializeProperty } from './property.serializer'

type SerializedProperty = ReturnType<typeof serializeProperty>

export interface IPropertyService {
  addProperty(property: { name: string, user: string }): Promise<SerializedProperty>
  editProperty(args: { id: string, value: any, user: string }): Promise<SerializedProperty>
  deleteProperty(args: { id: string, user: string }): Promise<void>
}

export default class PropertyService implements IPropertyService {
  public async addProperty (property: { name: string, user: string }): Promise<SerializedProperty> {
    return serializeProperty(propertyRepository.create(property))
  }

  public async editProperty ({ id, value, user }: { id: string, value: any, user: string }): Promise<SerializedProperty> {
    const updated = propertyRepository.update(id, user, value)
    /* istanbul ignore next — validatePropertyExist corre antes vía ruta */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
    return serializeProperty(updated)
  }

  public async deleteProperty ({ id, user }: { id: string, user: string }): Promise<void> {
    const supplyIds = supplyRepository.findByPropertyId(id).map(s => s.id)
    supplyReadingRepository.deleteBySupplyIds(supplyIds)
    supplyRepository.deleteByPropertyId(id)
    const deleted = propertyRepository.delete(id, user)
    /* istanbul ignore next */
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
  }
}
