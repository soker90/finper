import Boom from '@hapi/boom'
import { spanishCompare } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeCategory } from './categories.serializer'

type ICategoriesRepository = ReturnType<typeof import('./categories.repository').createCategoriesRepository>

// El service asume que la existencia/parent/params han sido validados en los
// validators (igual que el viejo). Solo conserva los `if (!x) 404` de seguridad
// y la mejora `hasChildren` (409) del borrado (opción C, no estaba en el viejo).
export class CategoriesService {
  constructor (private repository: ICategoriesRepository) {}

  public getCategories (user: string) {
    return this.repository.findByUser(user).map(serializeCategory)
  }

  public getGroupedCategories (user: string) {
    const all = this.repository.findByUser(user)
    const roots = all.filter(c => !c.parentId)
    const grouped = roots.map(root => ({
      _id: root.id,
      name: root.name,
      children: all
        .filter(c => c.parentId === root.id)
        .map(c => ({ _id: c.id, name: c.name }))
        .sort((a, b) => spanishCompare(a.name, b.name))
    }))
    return grouped.sort((a, b) => spanishCompare(a.name, b.name))
  }

  public addCategory ({ value, user }: { value: Record<string, any>, user: string }) {
    const { parent, ...rest } = value
    const created = this.repository.create({ ...rest, parentId: parent ?? null, user } as any)
    return serializeCategory(created)
  }

  public editCategory ({ id, value, user }: { id: string, value: Record<string, any>, user: string }) {
    const { parent, ...rest } = value
    const updated = this.repository.update(id, user, { ...rest, parentId: parent ?? null } as any)
    if (!updated) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }
    return serializeCategory(updated)
  }

  public deleteCategory ({ id, user }: { id: string, user: string }): void {
    if (this.repository.hasChildren(id)) {
      throw Boom.conflict(ERROR_MESSAGE.CATEGORY.HAS_CHILDREN).output
    }
    const deleted = this.repository.delete(id, user)
    if (!deleted) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }
  }
}
