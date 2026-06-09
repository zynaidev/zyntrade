export function normalizeTrade(t: Record<string, unknown>) {
  return {
    id: t.id,
    user_id: t.user_id,
    date: t.date,
    instrument: t.instrument,
    direction: t.direction,
    entryPrice: Number(t.entry_price),
    stopLoss: Number(t.stop_loss),
    closePrice: Number(t.close_price),
    entryTime: t.entry_time ?? null,
    exitTime: t.exit_time ?? null,
    notes: t.notes ?? '',
    image_urls: t.image_urls ?? [],
    tags: t.tags ?? [],
    mistake_tags: t.mistake_tags ?? [],
    r_multiple: Number(t.r_multiple ?? 0),
    created_at: t.created_at,
  }
}

export async function getTrades() {
  const res = await fetch('/api/trades')
  if (!res.ok) throw new Error('Failed to fetch trades')
  return (await res.json()).map(normalizeTrade)
}

export async function createTrade(data: object) {
  const res = await fetch('/api/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create trade')
  return normalizeTrade(await res.json())
}

export async function updateTrade(id: string, data: object) {
  const res = await fetch(`/api/trades/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update trade')
  return normalizeTrade(await res.json())
}

export async function deleteTrade(id: string) {
  const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete trade')
  return res.json()
}

export async function uploadImages(files: File[]) {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Failed to upload images')
  const data = await res.json()
  return data.urls as string[]
}
