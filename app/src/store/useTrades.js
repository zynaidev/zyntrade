import { create } from 'zustand'

const useTradeStore = create((set) => ({
  trades: [],
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
