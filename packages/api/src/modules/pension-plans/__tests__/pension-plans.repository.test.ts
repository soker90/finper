import { createTestDb, closeTestDb } from '../../../../test/helpers/db'
import { createPensionPlansRepository } from '../pension-plans.repository'
import { generateUsername } from '../../../../test/generate-values'
import type { DB } from '@soker90/finper-db'
import { schema } from '@soker90/finper-db'
import { eq } from 'drizzle-orm'

describe('Pension Plans Repository', () => {
  let db: DB
  let repository: ReturnType<typeof createPensionPlansRepository>
  let user: string

  beforeAll(() => {
    db = createTestDb()
    repository = createPensionPlansRepository(db)
    user = generateUsername()
    db.insert(schema.users).values({ id: 'some-id', username: user, password: 'pwd', createdAt: new Date() }).run()
  })

  afterAll(() => {
    db.delete(schema.users).where(eq(schema.users.username, user)).run()
    closeTestDb(db)
  })

  afterEach(() => {
    db.delete(schema.pensions).where(eq(schema.pensions.user, user)).run()
    db.delete(schema.pensionPlans).where(eq(schema.pensionPlans.user, user)).run()
  })

  it('creates a plan and scopes it by user', () => {
    const plan = repository.createPlan({ name: 'Plan A', user })
    expect(plan.name).toBe('Plan A')

    const otherUser = generateUsername()
    db.insert(schema.users).values({ id: 'other-id', username: otherUser, password: 'pwd', createdAt: new Date() }).run()

    expect(repository.findPlanById(plan.id, otherUser)).toBeUndefined()
    expect(repository.findPlanById(plan.id, user)?.id).toBe(plan.id)

    db.delete(schema.users).where(eq(schema.users.username, otherUser)).run()
  })

  it('deletes a plan and cascades its movements', () => {
    const plan = repository.createPlan({ name: 'Plan to delete', user })
    repository.createMovement({
      planId: plan.id,
      date: 1000,
      employeeAmount: 10,
      employeeUnits: 1,
      companyAmount: 10,
      companyUnits: 1,
      value: 10,
      user
    })

    const deleted = repository.deletePlan(plan.id, user)
    expect(deleted).toBe(true)

    const remainingMovements = db.select().from(schema.pensions).where(eq(schema.pensions.planId, plan.id)).all()
    expect(remainingMovements).toHaveLength(0)
  })

  it('returns movements of a plan ordered by date descending', () => {
    const plan = repository.createPlan({ name: 'Plan B', user })
    const data = {
      planId: plan.id,
      employeeAmount: 100,
      employeeUnits: 10,
      companyAmount: 100,
      companyUnits: 10,
      value: 10,
      user
    }
    repository.createMovement({ ...data, date: 1000 })
    repository.createMovement({ ...data, date: 3000 })
    repository.createMovement({ ...data, date: 2000 })

    const movements = repository.findMovements(plan.id, user)

    expect(movements).toHaveLength(3)
    expect(movements[0].date).toBe(3000)
    expect(movements[1].date).toBe(2000)
    expect(movements[2].date).toBe(1000)
  })

  it('findAllMovementsByUser returns movements across every plan of the user', () => {
    const planA = repository.createPlan({ name: 'Plan A', user })
    const planB = repository.createPlan({ name: 'Plan B', user })
    const data = { employeeAmount: 10, employeeUnits: 1, companyAmount: 10, companyUnits: 1, value: 10, user }
    repository.createMovement({ ...data, planId: planA.id, date: 1000 })
    repository.createMovement({ ...data, planId: planB.id, date: 2000 })

    const movements = repository.findAllMovementsByUser(user)
    expect(movements).toHaveLength(2)
    expect(movements[0].date).toBe(2000)
    expect(movements[1].date).toBe(1000)
  })
})
