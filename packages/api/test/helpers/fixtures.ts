import type { DB } from '@soker90/finper-db';
import { schema, generateId } from '@soker90/finper-db';

/**
 * Crea un usuario de test mínimo y devuelve su username.
 * La mayoría de tests necesitan un usuario para satisfacer las FKs.
 */
export async function createTestUser(
  db: DB,
  overrides: Partial<{ username: string; password: string }> = {},
): Promise<string> {
  const username = overrides.username ?? 'testuser';
  db.insert(schema.users).values({
    id: generateId(),
    username,
    password: overrides.password ?? 'hashed_test_password',
    createdAt: new Date(),
  }).run();
  return username;
}

// Añadir aquí helpers para createTestAccount, createTestCategory, etc.
// según se necesiten al migrar módulos en Fase 3. No crear todos ahora,
// solo el de usuario que es el más universal.
