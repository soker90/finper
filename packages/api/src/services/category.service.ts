import { CategoryModel, ICategory } from '@soker90/finper-models'

export interface ICategoryService {
    addCategory(category: ICategory): Promise<ICategory>

    editCategory({ id, value }: { id: string, value: ICategory }): Promise<ICategory>

    deleteCategory({ id }: { id: string }): Promise<void>

    getCategories(): Promise<ICategory[]>

}

export default class CategoryService implements ICategoryService {
  public async getCategories (): Promise<ICategory[]> {
    return CategoryModel.find({}, 'name')
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
