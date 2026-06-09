import { auth } from './auth'

async function migrate() {
  // @ts-ignore
  await auth.database.migrate()
  console.log('Migration done')
  process.exit(0)
}

migrate().catch(console.error)
