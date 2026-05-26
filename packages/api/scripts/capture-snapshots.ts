import fs from 'fs'
import path from 'path'

const API_URL = process.env.SNAPSHOT_TARGET_URL || 'http://localhost:3008'
const OUTPUT_DIR = path.resolve(__dirname, '../test/snapshots/pre-migration')

// Setup Output Dir
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Credentials for test user
const TEST_USER = {
  username: 'testuser',
  password: 'testpass1234'
}

const endpointsToCapture = [
  // Auth & Monit
  { method: 'GET', path: '/api/monit/health' },
  { method: 'GET', path: '/api/accounts/000000000000000000000000', expectedStatus: 404 },
  { method: 'POST', path: '/api/accounts', body: { name: 'Invalid' }, expectedStatus: 400 },

  // Accounts
  { method: 'GET', path: '/api/accounts' },

  // Transactions
  { method: 'GET', path: '/api/transactions' },
  { method: 'GET', path: '/api/transactions/summary' },

  // Categories
  { method: 'GET', path: '/api/categories' },

  // Budgets
  { method: 'GET', path: '/api/budgets' },
  { method: 'GET', path: '/api/budgets/year/2026' },

  // Subscriptions
  { method: 'GET', path: '/api/subscriptions' },

  // Loans
  { method: 'GET', path: '/api/loans' },

  // Debts
  { method: 'GET', path: '/api/debts' },

  // Goals
  { method: 'GET', path: '/api/goals' },

  // Stocks
  { method: 'GET', path: '/api/stocks' },

  // Pensions
  { method: 'GET', path: '/api/pensions' },

  // Properties
  { method: 'GET', path: '/api/properties' },

  // Supplies
  { method: 'GET', path: '/api/supplies' },

  // Stores
  { method: 'GET', path: '/api/stores' },

  // Dashboard
  { method: 'GET', path: '/api/dashboard' },
  { method: 'GET', path: '/api/dashboard/insights' }
]

async function run () {
  console.log('Capturing snapshots from ' + API_URL)

  // 0. Health check
  try {
    const health = await fetch(`${API_URL}/api/monit/health`)
    if (!health.ok) {
      console.error(`❌ ERROR: Health check failed (${health.status}). Is the API running on ${API_URL}?`)
      process.exit(1)
    }
  } catch {
    console.error(`❌ ERROR: Could not connect to API on ${API_URL}. Please ensure it is running.`)
    process.exit(1)
  }

  // 1. Login
  let token = ''
  try {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    })
    if (!loginRes.ok) {
      console.warn('⚠️ WARNING: Login failed. Using API without JWT. Ensure test user exists or create one manually.')
    } else {
      const loginData = await loginRes.json()
      token = loginData.token

      const filename = path.join(OUTPUT_DIR, 'POST__api_auth_login.json')
      fs.writeFileSync(filename, JSON.stringify({
        method: 'POST',
        path: '/api/auth/login',
        status: loginRes.status,
        headers: { 'content-type': loginRes.headers.get('content-type') },
        body: { token: '<REDACTED>' }
      }, null, 2))
    }
  } catch {
    console.error('Error connecting to API. Ensure it is running on ' + API_URL)
    process.exit(1)
  }

  // 2. Capture Endpoints
  for (const ep of endpointsToCapture) {
    console.log(`Capturing ${ep.method} ${ep.path}...`)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_URL}${ep.path}`, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      })

      // Parse Body
      let bodyData = null
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        bodyData = await res.json()
      } else {
        bodyData = await res.text()
      }

      const filename = path.join(OUTPUT_DIR, `${ep.method}__${ep.path.replace(/\//g, '_').replace(/^_/, '')}.json`)

      const snapshot = {
        method: ep.method,
        path: ep.path,
        status: res.status,
        headers: {
          'content-type': res.headers.get('content-type')
        },
        body: bodyData
      }

      fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2))

      // If we expect 200 but got 401, test user might not have data or token is invalid
      if (res.status >= 400 && !ep.expectedStatus) {
        console.warn(`⚠️ WARNING: ${ep.method} ${ep.path} returned ${res.status}`)
      }
    } catch (err: any) {
      console.error(`❌ ERROR: Failed to capture ${ep.method} ${ep.path}: ${err.message}`)
    }
  }

  console.log('\n✅ Capture complete! Snapshots saved to', OUTPUT_DIR)
}

run()
