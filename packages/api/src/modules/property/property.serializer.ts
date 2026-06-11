import { schema } from '@soker90/finper-db'
type Property = typeof schema.properties.$inferSelect

// Contrato viejo (doc Mongo crudo, sin __v): { _id, name, user }
export const serializeProperty = (p: Property) => ({ _id: p.id, name: p.name, user: p.user })
