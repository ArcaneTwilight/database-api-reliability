export type Stock = {
  documentId: string
  symbol: string
  companyName: string
  sector: string
  price: number
  change: number
  percentChange: number
  volume: number
  marketCap: string
  peRatio: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
}

export const stocksCollection = 'stocks'

export const mockStockData: Stock[] = [
  {
    documentId: 'HPQ',
    symbol: 'HPQ',
    companyName: 'HP Inc.',
    sector: 'Technology',
    price: 32.12,
    change: -0.03,
    percentChange: -0.09,
    volume: 10300000,
    marketCap: '28.97B',
    peRatio: 12.24,
    fiftyTwoWeekHigh: 36.23,
    fiftyTwoWeekLow: 17.56,
  },
  {
    documentId: 'INTC',
    symbol: 'INTC',
    companyName: 'Intel Corporation',
    sector: 'Technology / Semiconductors',
    price: 119.33,
    change: -0.67,
    percentChange: -0.56,
    volume: 28450000,
    marketCap: '630.67B',
    peRatio: null,
    fiftyTwoWeekHigh: 142.34,
    fiftyTwoWeekLow: 32.89,
  },
  {
    documentId: 'IBM',
    symbol: 'IBM',
    companyName: 'International Business Machines Corp.',
    sector: 'Technology / IT Services',
    price: 222.6,
    change: -3.02,
    percentChange: -1.34,
    volume: 3420000,
    marketCap: '209.76B',
    peRatio: 19.76,
    fiftyTwoWeekHigh: 332.46,
    fiftyTwoWeekLow: 199.19,
  },
]
