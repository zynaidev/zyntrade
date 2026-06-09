import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder')

/**
 * Uploads multiple screenshots to the 'trade-screenshots' bucket.
 * @param {File[]} files Array of image files to upload
 * @returns {Promise<string[]>} Array of public URLs
 */
export async function uploadScreenshots(files) {
  if (!files || files.length === 0) return []

  const uploadPromises = Array.from(files).map(async (file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `screenshots/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('trade-screenshots')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(filePath)

    return data.publicUrl
  })

  return Promise.all(uploadPromises)
}

/**
 * Inserts a new trade record into the 'trades' table.
 * @param {Object} tradeData The trade object to insert
 */
export async function insertTrade(tradeData) {
  const { data, error } = await supabase
    .from('trades')
    .insert([
      {
        instrument: tradeData.instrument,
        direction: tradeData.direction,
        entryPrice: tradeData.entryPrice,
        stopLoss: tradeData.stopLoss,
        closePrice: tradeData.closePrice,
        date: tradeData.date,
        notes: tradeData.notes || '',
        image_urls: tradeData.image_urls || [],
        entryTime: tradeData.entryTime || null,
        exitTime: tradeData.exitTime || null,
        tags: tradeData.tags || [],
        mistake_tags: tradeData.mistake_tags || [],
        r_multiple: tradeData.r_multiple || 0,
      }
    ])
    .select()

  if (error) {
    console.error('Error inserting trade:', error)
    throw error
  }

  return data?.[0]
}

/**
 * Updates an existing trade record.
 * @param {string|number} id The trade ID
 * @param {Object} tradeData The updated data
 */
export async function updateTrade(id, tradeData) {
  const { data, error } = await supabase
    .from('trades')
    .update({
      instrument: tradeData.instrument,
      direction: tradeData.direction,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      closePrice: tradeData.closePrice,
      date: tradeData.date,
      notes: tradeData.notes || '',
      image_urls: tradeData.image_urls || [],
      entryTime: tradeData.entryTime || null,
      exitTime: tradeData.exitTime || null,
      tags: tradeData.tags || [],
      mistake_tags: tradeData.mistake_tags || [],
      r_multiple: tradeData.r_multiple || 0,
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating trade:', error)
    throw error
  }

  return data?.[0]
}

/**
 * Deletes a trade record.
 * @param {string|number} id The trade ID
 */
export async function deleteTrade(id) {
  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting trade:', error)
    throw error
  }

  return true
}

/**
 * Fetches all trade records from the 'trades' table.
 */
export async function getTrades() {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching trades:', error)
    throw error
  }

  return data
}
