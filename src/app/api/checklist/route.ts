import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { headers } from 'next/headers'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  let query = 'SELECT * FROM checklist_runs WHERE user_id = $1'
  const params: unknown[] = [session.user.id]

  if (date) {
    query += ' AND date = $2'
    params.push(date)
  }

  query += ' ORDER BY date DESC, created_at DESC'

  const result = await pool.query(query, params)
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const result = await pool.query(
    `INSERT INTO checklist_runs
      (user_id, date, instrument, session, direction, approved, checked_count, total_rules, rules_checked, trade_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      session.user.id,
      body.date,
      body.instrument,
      body.session,
      body.direction || null,
      body.approved || false,
      body.checked_count || 0,
      body.total_rules || 0,
      body.rules_checked || {},
      body.trade_id || null,
    ]
  )
  return NextResponse.json(result.rows[0])
}
