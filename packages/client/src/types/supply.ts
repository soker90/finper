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

export interface SupplyReading {
  _id: string
  supplyId: string
  startDate: number
  endDate: number
  amount: number
  consumption?: number
  consumptionPeak?: number
  consumptionFlat?: number
  consumptionOffPeak?: number
}

export interface SupplyReadingInput {
  supplyId: string
  startDate: number
  endDate: number
  amount: number
  consumption?: number
  consumptionPeak?: number
  consumptionFlat?: number
  consumptionOffPeak?: number
}
