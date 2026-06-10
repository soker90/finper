import { MongoClient } from 'mongodb'

const c = new MongoClient(process.env.MONGODB!)
await c.connect()
const db = c.db()

const queries: Array<[string, Record<string, unknown>]> = [
  ['transactions', { tags: { $exists: true, $ne: [] } }],
  ['categories', { parent: { $exists: true } }],
  ['subscriptions', { currency: { $exists: true } }],
  ['supplies', { name: { $exists: true } }]
]

for (const [coll, q] of queries) {
  console.log('--- ' + coll + ' ---')
  console.log(JSON.stringify(await db.collection(coll).findOne(q), null, 2))
}

await c.close()
