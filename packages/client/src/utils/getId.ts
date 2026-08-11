interface EntityWithId {
  id?: string
  _id?: string
}

export const getId = (entity: EntityWithId): string => entity.id ?? entity._id ?? ''
