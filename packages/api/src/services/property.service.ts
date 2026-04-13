import { PropertyModel, SupplyModel, SupplyReadingModel, IProperty, PropertyDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface IPropertyService {
  addProperty(property: IProperty): Promise<PropertyDocument>
  editProperty({ id, value }: { id: string, value: IProperty }): Promise<PropertyDocument>
  deleteProperty({ id }: { id: string }): Promise<void>
}

export default class PropertyService implements IPropertyService {
  public async addProperty (property: IProperty): Promise<PropertyDocument> {
    return PropertyModel.create(property)
  }

  public async editProperty ({ id, value }: { id: string, value: IProperty }): Promise<PropertyDocument> {
    const updated = await PropertyModel.findByIdAndUpdate<PropertyDocument>(id, value, { returnDocument: 'after' })
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
    return updated
  }

  public async deleteProperty ({ id }: { id: string }): Promise<void> {
    const supplies = await SupplyModel.find({ propertyId: id }).select('_id')
    const supplyIds = supplies.map(({ _id }) => _id)

    if (supplyIds.length > 0) {
      await SupplyReadingModel.deleteMany({ supplyId: { $in: supplyIds } })
      await SupplyModel.deleteMany({ propertyId: id })
    }

    const deleted = await PropertyModel.findByIdAndDelete(id)
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.PROPERTY.NOT_FOUND).output
  }
}
