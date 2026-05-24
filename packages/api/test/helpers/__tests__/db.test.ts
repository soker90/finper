import { eq } from 'drizzle-orm';
import { schema, generateId } from '@soker90/finper-db';
import { createTestDb, closeTestDb } from '../db';
import { createTestUser } from '../fixtures';

describe('test db helper', () => {
  it('creates an isolated in-memory database with migrations applied', () => {
    const db = createTestDb();

    const id = generateId();
    db.insert(schema.users).values({
      id,
      username: 'alice',
      password: 'pw',
      createdAt: new Date(),
    }).run();

    const found = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    expect(found).toBeDefined();
    expect(found?.username).toBe('alice');
    expect(found?.isActive).toBe(true);

    closeTestDb(db);
  });

  it('produces fresh databases on each call (isolation)', () => {
    const db1 = createTestDb();
    const db2 = createTestDb();

    createTestUser(db1, { username: 'in_db1' });

    const fromDb2 = db2.select().from(schema.users).all();
    expect(fromDb2).toHaveLength(0);

    closeTestDb(db1);
    closeTestDb(db2);
  });

  it('enforces foreign keys', () => {
    const db = createTestDb();

    expect(() => {
      db.insert(schema.accounts).values({
        id: generateId(),
        name: 'Test',
        bank: 'TestBank',
        balance: 0,
        user: 'nonexistent_user',
      }).run();
    }).toThrow(/FOREIGN KEY/i);

    closeTestDb(db);
  });

  it('applies REAL type for monetary fields', () => {
    const db = createTestDb();
    createTestUser(db);

    const accountId = generateId();
    db.insert(schema.accounts).values({
      id: accountId,
      name: 'Checking',
      bank: 'TestBank',
      balance: 1234.56,
      user: 'testuser',
    }).run();

    const acc = db.select().from(schema.accounts).where(eq(schema.accounts.id, accountId)).get();
    expect(acc?.balance).toBeCloseTo(1234.56, 2);

    closeTestDb(db);
  });
});
