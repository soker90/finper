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
      value: 9,
      user: username
    })

    repository.createMovement({
      planId: source.id,
      date: 2,
      employeeAmount: 100,
      employeeUnits: 10,
      companyAmount: 0,
      companyUnits: 0,
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
    expect(sourceAggregate.employeeAmount).toBe(700)
    expect(sourceAggregate.companyAmount).toBe(400)

    expect(destinationAggregate.units).toBe(70)
    expect(destinationAggregate.total).toBe(1400)
    expect(destinationAggregate.employeeAmount).toBe(200)
    expect(destinationAggregate.companyAmount).toBe(100)

    expect(summary.total).toBe(1400)
  })

  it('rejects a transfer when either plan has no current valuation and none is provided', () => {
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

    let thrown: any
    try {
      service.transferAssets({
        sourcePlanId: source.id,
        destinationPlanId: destination.id,
        user: username
      })
    } catch (error) {
      thrown = error
    }

    expect(thrown.payload.message).toBe('El plan de origen y destino deben tener al menos una valoración registrada')
  })

  it('transfers assets to a brand new plan when destinationValue is explicitly provided', () => {
    const source = repository.createPlan({ name: 'Origen', color: '#4CAF50', user: username })
    const destination = repository.createPlan({ name: 'Destino Nuevo', color: '#2196F3', user: username })

    repository.createMovement({
      planId: source.id,
      date: 1,
      employeeAmount: 300,
      employeeUnits: 30,
      companyAmount: 100,
      companyUnits: 10,
      value: 10,
      user: username
    })

    const transferDate = 1700000000000
    service.transferAssets({
      sourcePlanId: source.id,
      destinationPlanId: destination.id,
      destinationValue: 20,
      date: transferDate,
      user: username
    })

    const sourceAggregate = service.getPlanById(source.id, username)
    const destinationAggregate = service.getPlanById(destination.id, username)

    expect(sourceAggregate.units).toBe(0)
    expect(sourceAggregate.total).toBe(0)

    // source had 40 units * 10€ = 400€. At 20€/unit in destination -> 20 units
    expect(destinationAggregate.units).toBe(20)
    expect(destinationAggregate.total).toBe(400)

    const destinationMovements = repository.findMovements(destination.id, username)
    expect(destinationMovements).toHaveLength(1)
    expect(destinationMovements[0].date).toBe(transferDate)
    expect(destinationMovements[0].value).toBe(20)
    expect(destinationMovements[0].employeeUnits).toBe(15) // 75% employee
    expect(destinationMovements[0].companyUnits).toBe(5) // 25% company
  })

  it('rejects a transfer to the exact same plan', () => {
    const plan = repository.createPlan({ name: 'Mismo Plan', color: '#4CAF50', user: username })

    expect(() => {
      service.transferAssets({
        sourcePlanId: plan.id,
        destinationPlanId: plan.id,
        user: username
      })
    }).toThrow()
  })

  it('rejects a transfer when source plan has no available units', () => {
    const source = repository.createPlan({ name: 'Origen Vacío', color: '#4CAF50', user: username })
    const destination = repository.createPlan({ name: 'Destino', color: '#2196F3', user: username })

    expect(() => {
      service.transferAssets({
        sourcePlanId: source.id,
        destinationPlanId: destination.id,
        destinationValue: 10,
        user: username
      })
    }).toThrow()
  })

  it('rejects a transfer when plan belongs to another user', () => {
    db.insert(users).values({
      id: generateId(),
      username: 'otheruser',
      password: 'pwd-hash',
      createdAt: new Date()
    }).run()

    const source = repository.createPlan({ name: 'Origen', color: '#4CAF50', user: username })
    const otherPlan = repository.createPlan({ name: 'Otro Usuario', color: '#2196F3', user: 'otheruser' })

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

    expect(() => {
      service.transferAssets({
        sourcePlanId: source.id,
        destinationPlanId: otherPlan.id,
        destinationValue: 10,
        user: username
      })
    }).toThrow()
  })
})
