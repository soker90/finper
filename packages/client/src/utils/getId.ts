interface EntityWithId {
  id?: string
  _id?: string
}

// Treats empty strings as absent so callers never build URLs/keys like
// `credit-cards//pay-debt` or collections with duplicate '' keys.
export const getId = (entity: EntityWithId): string | undefined => entity.id || entity._id || undefined
