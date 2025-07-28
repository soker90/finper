import { CategoryModel, ICategory } from '@soker90/finper-models'

export interface ICategoryService {
  addCategory(category: ICategory): Promise<ICategory>

  editCategory({ id, value }: { id: string, value: ICategory }): Promise<ICategory>

  deleteCategory({ id }: { id: string }): Promise<void>

  getCategories(user: string): Promise<ICategory[]>

  getGroupedCategories(): Promise<any[]>

}

export default class CategoryService implements ICategoryService {
  public async getCategories (user: string): Promise<ICategory[]> {
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

  public async addCategory (category: ICategory): Promise<ICategory> {
    return CategoryModel.create(category)
  }

  public async editCategory ({ id, value }: { id: string, value: ICategory }): Promise<ICategory> {
    return CategoryModel.findByIdAndUpdate(id, value, { new: true }) as unknown as ICategory
  }

  public async deleteCategory ({ id }: { id: string }): Promise<void> {
    await CategoryModel.deleteOne({ _id: id })
  }
}
