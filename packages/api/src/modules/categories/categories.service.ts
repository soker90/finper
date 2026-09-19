import Boom from '@hapi/boom'
import { spanishCompare } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeCategory } from './categories.serializer'

type ICategoriesRepository = ReturnType<typeof import('./categories.repository').createCategoriesRepository>

const isForeignKeyError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === 'SQLITE_CONSTRAINT_FOREIGNKEY'

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
    let deleted
    try {
      deleted = this.repository.delete(id, user)
    } catch (error) {
      // The category is referenced (transactions, split lines, credit card
      // movements, budgets...) by a FK without cascade: translate the SQLite
      // constraint error into a 409 instead of a generic 500.
      if (isForeignKeyError(error)) throw Boom.conflict(ERROR_MESSAGE.CATEGORY.IN_USE).output
      throw error
    }
    if (!deleted) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }
  }
}
