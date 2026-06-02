import { eq, and, asc } from 'drizzle-orm'
import { type DB, schema, generateId } from '@soker90/finper-db'
const { categories } = schema

type NewCategory = typeof categories.$inferInsert
type Category = typeof categories.$inferSelect

export const createCategoriesRepository = (db: DB) => ({
  // Lista plana del usuario, ordenada por name (replica .sort('name') del viejo).
  findByUser: (user: string): Category[] => {
    return db.select()
      .from(categories)
      .where(eq(categories.user, user))
      .orderBy(asc(categories.name))
      .all()
  },

  findById: (id: string, user: string): Category | undefined => {
    return db.select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.user, user)))
      .get()
  },

  // Para opción C del borrado: ¿esta categoría es padre de alguna?
  hasChildren: (id: string): boolean => {
    const child = db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, id))
      .get()
    return Boolean(child)
  },

  create: (data: Omit<NewCategory, 'id'>): Category => {
    const id = generateId()
    return db.insert(categories).values({ ...data, id }).returning().get()
  },

  update: (id: string, user: string, data: Partial<Omit<NewCategory, 'id' | 'user'>>): Category | undefined => {
    return db.update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.user, user)))
      .returning()
      .get()
  },

  delete: (id: string, user: string): Category | undefined => {
    return db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.user, user)))
      .returning()
      .get()
  }
})
