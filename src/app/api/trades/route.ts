import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await pool.query(
    'SELECT * FROM trades WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
    [session.user.id]
  )
  return NextResponse.json(result.rows)
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const result = await pool.query(
    `INSERT INTO trades 
      (user_id, instrument, direction, entry_price, stop_loss, close_price, 
       entry_time, exit_time, date, notes, image_urls, tags, mistake_tags, r_multiple)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      session.user.id,
      body.instrument,
      body.direction,
      body.entry_price,
      body.stop_loss,
      body.close_price,
      body.entry_time || null,
      body.exit_time || null,
      body.date,
      body.notes || '',
      body.image_urls || [],
      body.tags || [],
      body.mistake_tags || [],
      body.r_multiple || 0,
    ]
  )
  return NextResponse.json(result.rows[0])
}
