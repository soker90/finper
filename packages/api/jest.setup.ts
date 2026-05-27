import path from 'node:path'
import os from 'node:os'

const workerId = process.env.JEST_WORKER_ID ?? '0'
process.env.DATABASE_FILE = path.join(os.tmpdir(), `finper-test-${workerId}-${process.pid}.db`)
