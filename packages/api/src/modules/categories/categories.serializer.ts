import { schema } from '@soker90/finper-db'

type Category = typeof schema.categories.$inferSelect

// Forma EXACTA del snapshot pre-migration GET /api/categories:
//   { _id, name, type, budgetRuleClass }  y  parent: { _id } SOLO si tiene padre.
// No incluye `user`, ni `color`/`icon`.
export const serializeCategory = (category: Category) => {
  const result: Record<string, any> = {
    _id: category.id,
    name: category.name,
    type: category.type,
    budgetRuleClass: category.budgetRuleClass
  }

  if (category.parentId) {
    result.parent = { _id: category.parentId }
  }

  return result
}
