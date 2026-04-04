import { CategoryModel, ICategory, CategoryDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'

export interface ICategoryService {
  addCategory(category: ICategory): Promise<CategoryDocument>

  editCategory({ id, value }: { id: string, value: ICategory }): Promise<CategoryDocument>

  deleteCategory({ id }: { id: string }): Promise<void>

  getCategories(user: string): Promise<CategoryDocument[]>

  getGroupedCategories(): Promise<any[]>

}

export default class CategoryService implements ICategoryService {
  public async getCategories (user: string): Promise<CategoryDocument[]> {
    return CategoryModel.find({ user }, '_id name type').populate('parent', '_id').sort('name')
  }

  public async getGroupedCategories (): Promise<any[]> {
    return CategoryModel.aggregate([
      {
        $match: {
          parent: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parent',
          as: 'children'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          children: {
            _id: 1,
            name: 1
          }
        }
      },
      { $sort: { name: 1, children: 1 } }
    ])
  }

  public async addCategory (category: ICategory): Promise<CategoryDocument> {
    return CategoryModel.create(category)
  }

  public async editCategory ({ id, value }: { id: string, value: ICategory }): Promise<CategoryDocument> {
    const updated = await CategoryModel.findByIdAndUpdate(id, value, { new: true }) as unknown as CategoryDocument | null
    if (!updated) throw Boom.notFound('Category not found').output
    return updated
  }

  public async deleteCategory ({ id }: { id: string }): Promise<void> {
    const deleted = await CategoryModel.findByIdAndDelete(id)
    if (!deleted) throw Boom.notFound('Category not found').output
  }
}
