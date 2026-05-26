async function run() {
  try {
    const login = await fetch('http://localhost:3008/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'testpass1234' })
    })
    const loginData = await login.json()
    const token = loginData.token

    const res = await fetch('http://localhost:3008/api/goals', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const goals = await res.json()
    console.log("ACTUAL:", JSON.stringify(goals, null, 2))
  } catch (err) {
    console.error(err)
  }
}
run()
