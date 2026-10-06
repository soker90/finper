import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createPensionPlansRepository } from '../pension-plans.repository'
import { PensionPlansService } from '../pension-plans.service'
import { schema, generateId } from '@soker90/finper-db'
import type { DB } from '@soker90/finper-db'

const { users } = schema

describe('PensionPlansService', () => {
  let db: DB
  let repository: ReturnType<typeof createPensionPlansRepository>
  let service: PensionPlansService
  const username = 'testuser'

  beforeEach(() => {
    db = createTestDb()
    repository = createPensionPlansRepository(db)
    service = new PensionPlansService(repository)

    db.insert(users).values({
      id: generateId(),
      username,
      password: 'pwd-hash',
      createdAt: new Date()
    }).run()
  })

  afterEach(() => {
    closeTestDb(db)
  })

  it('transfers the current value between plans without moving contribution history', () => {
    const source = repository.createPlan({ name: 'Origen', color: '#4CAF50', user: username })
    const destination = repository.createPlan({ name: 'Destino', color: '#2196F3', user: username })

    repository.createMovement({
      planId: source.id,
      date: 1,
      employeeAmount: 600,
      employeeUnits: 60,
      companyAmount: 400,
      companyUnits: 40,
      value: 10,
      user: username
    })

    repository.createMovement({
      planId: destination.id,
      date: 1,
      employeeAmount: 200,
      employeeUnits: 10,
      companyAmount: 100,
      companyUnits: 5,
      value: 20,
      user: username
    })

    service.transferAssets({
      sourcePlanId: source.id,
      destinationPlanId: destination.id,
      user: username
    })

    const sourceAggregate = service.getPlanById(source.id, username)
    const destinationAggregate = service.getPlanById(destination.id, username)
    const summary = service.getAggregateSummary(username)

    expect(sourceAggregate.units).toBe(0)
    expect(sourceAggregate.total).toBe(0)
    expect(sourceAggregate.employeeAmount).toBe(600)
    expect(sourceAggregate.companyAmount).toBe(400)

    expect(destinationAggregate.units).toBe(70)
    expect(destinationAggregate.total).toBe(1400)
    expect(destinationAggregate.employeeAmount).toBe(200)
    expect(destinationAggregate.companyAmount).toBe(100)

    expect(summary.total).toBe(1400)
  })

  it('rejects a transfer when either plan has no current valuation', () => {
    const source = repository.createPlan({ name: 'Origen', color: '#4CAF50', user: username })
    const destination = repository.createPlan({ name: 'Destino', color: '#2196F3', user: username })

    repository.createMovement({
      planId: source.id,
      date: 1,
      employeeAmount: 100,
      employeeUnits: 10,
      companyAmount: 0,
      companyUnits: 0,
      value: 10,
      user: username
    })

    expect(() => service.transferAssets({
      sourcePlanId: source.id,
      destinationPlanId: destination.id,
      user: username
    })).toThrow('El plan de origen y destino deben tener al menos una valoración registrada')
  })
})
