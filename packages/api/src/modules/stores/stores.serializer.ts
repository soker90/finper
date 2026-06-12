import { schema } from '@soker90/finper-db'

type Store = typeof schema.stores.$inferSelect

// Forma del snapshot GET /api/stores: { _id, name } (sin user).
export const serializeStore = (store: Store) => ({
  _id: store.id,
  name: store.name
})
