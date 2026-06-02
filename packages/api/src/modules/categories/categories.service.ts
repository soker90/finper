import Boom from '@hapi/boom'
import { isValidId } from '../../utils'
import { spanishCompare } from '@soker90/finper-db'
import { ERROR_MESSAGE } from '../../i18n'
import { serializeCategory } from './categories.serializer'
import { validateCategoryCreateParams, validateCategoryEditParams } from './categories.schema'

type ICategoriesRepository = ReturnType<typeof import('./categories.repository').createCategoriesRepository>

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

  // 1:1 con el viejo: parent (404) ANTES del Joi (422).
  public addCategory ({ body, user }: { body: Record<string, any>, user: string }) {
    if (body.parent) {
      const parentCat = this.repository.findById(body.parent, user)
      if (!parentCat) {
        throw Boom.notFound(ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND).output
      }
    }

    const value = validateCategoryCreateParams(body)
    const { parent, ...rest } = value
    const created = this.repository.create({ ...rest, parentId: parent ?? null, user } as any)
    return serializeCategory(created)
  }

  // 1:1 con el viejo: isValidId (400) -> existe (404) -> parent (404) -> Joi (422).
  public editCategory ({ id, body, user }: { id: string, body: Record<string, any>, user: string }) {
    if (!isValidId(id)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }

    const existing = this.repository.findById(id, user)
    if (!existing) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }

    if (body.parent) {
      const parentCat = this.repository.findById(body.parent, user)
      if (!parentCat) {
        throw Boom.notFound(ERROR_MESSAGE.CATEGORY.PARENT_NOT_FOUND).output
      }
    }

    const value = validateCategoryEditParams(body)
    const { parent, ...rest } = value
    const updated = this.repository.update(id, user, { ...rest, parentId: parent ?? null } as any)
    if (!updated) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }

    return serializeCategory(updated)
  }

  // opción C: implementa el TODO del controller viejo.
  public deleteCategory ({ id, user }: { id: string, user: string }): void {
    if (!isValidId(id)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }

    const existing = this.repository.findById(id, user)
    if (!existing) {
      throw Boom.notFound(ERROR_MESSAGE.CATEGORY.NOT_FOUND).output
    }

    if (this.repository.hasChildren(id)) {
      throw Boom.conflict(ERROR_MESSAGE.CATEGORY.HAS_CHILDREN).output
    }

    this.repository.delete(id, user)
  }
}
