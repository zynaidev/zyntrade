import { create } from 'zustand'

const useTradeStore = create((set) => ({
  trades: [
    // Seed data so calendar has some entries to show
    // We use UUID-like strings to avoid "invalid input syntax for type uuid" error
    {
      id: '00000000-0000-0000-0000-000000000001',
      date: new Date().toISOString().split('T')[0],
      instrument: 'BTC/USD',
      direction: 'long',
      entryPrice: 67500,
      stopLoss: 66800,
      closePrice: 68900,
      notes: 'Initial test trade. Good setup at support.',
      image_urls: [],
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      date: new Date().toISOString().split('T')[0],
      instrument: 'NQ100',
      direction: 'short',
      entryPrice: 19850,
      stopLoss: 20000,
      closePrice: 19600,
      notes: 'Bearish continuation tested. Stop safely in profit.',
      image_urls: [],
    },
  ],
  loading: false,
  setLoading: (loading) => set({ loading }),
  setTrades: (trades) => set({ trades }),
  addTrade: (trade) =>
    set((state) => ({
      trades: [
        ...state.trades,
        {
          ...trade,
          id: trade.id || Date.now(),
          imageUrls: trade.imageUrls || [],
        },
      ],
    })),

  updateTrade: (updatedTrade) =>
    set((state) => ({
      trades: state.trades.map((t) =>
        t.id === updatedTrade.id ? { ...t, ...updatedTrade } : t
      ),
    })),

  removeTrade: (id) =>
    set((state) => ({
      trades: state.trades.filter((t) => t.id !== id),
    })),

  getTradesForDate: (date) =>
    useTradeStore.getState().trades.filter((t) => t.date === date),
}))

export default useTradeStore
