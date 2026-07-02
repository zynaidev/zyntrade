import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { headers } from 'next/headers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const result = await pool.query(
    `UPDATE trades SET
      instrument=$1, direction=$2, entry_price=$3, stop_loss=$4, close_price=$5,
      entry_time=$6, exit_time=$7, date=$8, notes=$9, image_urls=$10,
      tags=$11, mistake_tags=$12, r_multiple=$13
     WHERE id=$14 AND user_id=$15
     RETURNING *`,
    [
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
      id,
      session.user.id,
    ]
  )
  if (result.rows.length === 0)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await pool.query(
    'DELETE FROM trades WHERE id=$1 AND user_id=$2',
    [id, session.user.id]
  )
  return NextResponse.json({ success: true })
}
