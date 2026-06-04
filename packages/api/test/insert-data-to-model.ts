import { faker } from '@faker-js/faker'
import {
  PropertyModel, SupplyModel, SupplyReadingModel,
  IProperty, ISupply, ISupplyReading, SUPPLY_TYPE
} from '@soker90/finper-models'

import { db as sqliteDb } from '../src/db'
import hashPassword from '../src/helpers/hash-password'
import { schema, generateId } from '@soker90/finper-db'
const { users } = schema

import {
  MAX_USERNAME_LENGTH, MIN_LENGTH_USERNAME,
  MIN_PASSWORD_LENGTH
} from '../src/config/inputs'
import { generateUsername } from './generate-values'

export const insertCredentials = (params: Record<string, string | boolean> = {}): Promise<{ username: string }> => {
  const username = ((params.username as string) ?? faker.internet.username())
    .slice(0, MAX_USERNAME_LENGTH).toLowerCase()
  const password = (params.password as string) ?? faker.internet.password({ length: MIN_PASSWORD_LENGTH })

  sqliteDb.insert(users).values({
    id: generateId(),
    username,
    password: hashPassword(password),
    createdAt: new Date(),
  }).run()

  return Promise.resolve({ username })
}

export const insertPension = async (params: Record<string, any> = {}): Promise<any> => {
  const id = generateId()
  const data = {
    id,
    date: new Date(params.date ?? faker.date.past()),
    value: params.value ?? faker.number.int(),
    companyAmount: params.companyAmount ?? faker.number.int(),
    companyUnits: params.companyUnits ?? faker.number.int(),
    employeeUnits: params.employeeUnits ?? faker.number.int(),
    employeeAmount: params.employeeAmount ?? faker.number.int(),
    user: params.user ?? faker.internet.username().slice(MIN_LENGTH_USERNAME, MAX_USERNAME_LENGTH).toLowerCase()
  }
  sqliteDb.insert(schema.pensions).values(data).run()
  return data
}

export const insertProperty = async (params: Record<string, any> = {}): Promise<IProperty & { _id: any }> => {
  const user = (params.user ?? generateUsername()) as string

  return PropertyModel.create({
    name: params.name ?? faker.location.streetAddress(),
    user
  }) as unknown as IProperty & { _id: any }
}

export const insertSupply = async (params: Record<string, any> = {}): Promise<ISupply & { _id: any }> => {
  const user = (params.user ?? generateUsername()) as string
  const propertyId = params.propertyId ?? (await insertProperty({ user }))._id

  return SupplyModel.create({
    name: faker.company.name(),
    type: SUPPLY_TYPE.ELECTRICITY,
    ...params,
    propertyId,
    user
  }) as unknown as ISupply & { _id: any }
}

export const insertSupplyReading = async (params: Record<string, any> = {}): Promise<ISupplyReading & { _id: any }> => {
  const user = (params.user ?? generateUsername()) as string
  const supplyId = params.supplyId ?? (await insertSupply({ user }))._id
  const startDate = params.startDate ?? faker.date.past({ years: 1 }).getTime()
  const endDate = params.endDate ?? faker.date.between({ from: startDate, to: Date.now() }).getTime()

  return SupplyReadingModel.create({
    supplyId,
    startDate,
    endDate,
    amount: params.amount ?? faker.number.float({ min: -50, max: 250, multipleOf: 0.01 }),
    consumptionPeak: params.consumptionPeak ?? faker.number.int({ min: 10, max: 100 }),
    consumptionFlat: params.consumptionFlat ?? faker.number.int({ min: 10, max: 100 }),
    consumptionOffPeak: params.consumptionOffPeak ?? faker.number.int({ min: 10, max: 100 }),
    consumption: params.consumption ?? faker.number.int({ min: 10, max: 100 }),
    user
  }) as unknown as ISupplyReading & { _id: any }
}
