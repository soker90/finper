export type SupplyType = 'electricity' | 'water' | 'gas' | 'internet' | 'other'

export interface Property {
  _id: string
  name: string
}

export interface Supply {
  _id: string
  name?: string
  type: SupplyType
  propertyId: string
}

export interface PropertyWithSupplies extends Property {
  supplies: Supply[]
}

export interface PropertyInput {
  name: string
}

export interface SupplyInput {
  name?: string
  type: SupplyType
  propertyId: string
}
