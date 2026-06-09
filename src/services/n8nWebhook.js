/**
 * n8n Webhook Service
 * Sends trade data as JSON payload to the configured n8n webhook endpoint.
 */

const WEBHOOK_URL = 'https://tweb.n8n.local/webhook/trade'

/**
 * @param {Object} tradeData - The trade object to send
 * @param {string} tradeData.instrument
 * @param {string} tradeData.direction
 * @param {number} tradeData.entryPrice
 * @param {number} tradeData.stopLoss
 * @param {number} tradeData.closePrice
 * @param {string} tradeData.date
 */
export async function sendTradeToWebhook(tradeData) {
  const payload = {
    ...tradeData,
    timestamp: new Date().toISOString(),
    source: 'TradeFlow-Journal',
  }

  console.log('[n8n Webhook] Sending payload:', payload)

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`)
    }

    console.log('[n8n Webhook] Payload delivered successfully.')
    return { success: true }
  } catch (error) {
    console.error('[n8n Webhook] Failed to deliver payload:', error.message)
    // Don't throw — trade is still saved locally
    return { success: false, error: error.message }
  }
}
