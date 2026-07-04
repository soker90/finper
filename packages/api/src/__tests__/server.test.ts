import { checkpointAndCloseDatabase } from '../server'

type SqliteConnection = Parameters<typeof checkpointAndCloseDatabase>[0]

const buildMockClient = (overrides: Partial<SqliteConnection> = {}): SqliteConnection => ({
  open: true,
  pragma: jest.fn().mockReturnValue([{ busy: 0, log: 10, checkpointed: 10 }]),
  close: jest.fn(),
  ...overrides
} as unknown as SqliteConnection)

describe('checkpointAndCloseDatabase', () => {
  it('runs a WAL checkpoint and closes the connection on success', () => {
    const client = buildMockClient()

    const exitCode = checkpointAndCloseDatabase(client)

    expect(client.pragma).toHaveBeenCalledWith('wal_checkpoint(TRUNCATE)')
    expect(client.close).toHaveBeenCalledTimes(1)
    expect(exitCode).toBe(0)
  })

  it('skips the checkpoint entirely when the connection is already closed', () => {
    const client = buildMockClient({ open: false })

    const exitCode = checkpointAndCloseDatabase(client)

    expect(client.pragma).not.toHaveBeenCalled()
    expect(client.close).not.toHaveBeenCalled()
    expect(exitCode).toBe(0)
  })

  it('still exits with code 0 when the checkpoint could not fully truncate the WAL (busy)', () => {
    const client = buildMockClient({
      pragma: jest.fn().mockReturnValue([{ busy: 1, log: 10, checkpointed: 4 }])
    })

    const exitCode = checkpointAndCloseDatabase(client)

    expect(client.close).toHaveBeenCalledTimes(1)
    expect(exitCode).toBe(0)
  })

  it('closes the connection and exits with code 1 when the checkpoint pragma throws', () => {
    const client = buildMockClient({
      pragma: jest.fn().mockImplementation(() => { throw new Error('disk I/O error') })
    })

    const exitCode = checkpointAndCloseDatabase(client)

    expect(client.close).toHaveBeenCalledTimes(1)
    expect(exitCode).toBe(1)
  })

  it('exits with code 1 when closing the connection throws, even if the checkpoint succeeded', () => {
    const client = buildMockClient({
      close: jest.fn().mockImplementation(() => { throw new Error('database is locked') })
    })

    const exitCode = checkpointAndCloseDatabase(client)

    expect(exitCode).toBe(1)
  })

  it('exits with code 1 when both the checkpoint and the close fail', () => {
    const client = buildMockClient({
      pragma: jest.fn().mockImplementation(() => { throw new Error('disk I/O error') }),
      close: jest.fn().mockImplementation(() => { throw new Error('database is locked') })
    })

    const exitCode = checkpointAndCloseDatabase(client)

    expect(exitCode).toBe(1)
  })
})
