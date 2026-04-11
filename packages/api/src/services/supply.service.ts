import { SupplyModel, PropertyModel, ISupply, SupplyDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface ISupplyService {
  addSupply(supply: ISupply): Promise<SupplyDocument>
  editSupply({ id, value }: { id: string, value: ISupply }): Promise<SupplyDocument>
  deleteSupply({ id }: { id: string }): Promise<void>
  getSuppliesGroupedByProperty(user: string): Promise<any[]>
}

export default class SupplyService implements ISupplyService {
  public async getSuppliesGroupedByProperty (user: string): Promise<any[]> {
    return PropertyModel.aggregate([
      { $match: { user } },
      {
        $lookup: {
          from: SupplyModel.collection.name,
          localField: '_id',
          foreignField: 'propertyId',
          as: 'supplies'
        }
      },
      { $sort: { name: 1 } }
    ])
  }

  public async addSupply (supply: ISupply): Promise<SupplyDocument> {
    return SupplyModel.create(supply)
  }

  public async editSupply ({ id, value }: { id: string, value: ISupply }): Promise<SupplyDocument> {
    const updated = await SupplyModel.findByIdAndUpdate<SupplyDocument>(id, value, { returnDocument: 'after' })
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
    return updated
  }

  public async deleteSupply ({ id }: { id: string }): Promise<void> {
    const deleted = await SupplyModel.findByIdAndDelete(id)
    if (!deleted) throw Boom.notFound(ERROR_MESSAGE.SUPPLY.NOT_FOUND).output
  }
}
