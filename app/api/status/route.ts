import { NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase-admin'
import { mockStockData, stocksCollection, type Stock } from '@/lib/stocks'

export const dynamic = 'force-dynamic'

type Check = { timestamp: string; latency: number; success: boolean }

type StatusStore = { checks: Check[] }

function toStock(document: FirebaseFirestore.QueryDocumentSnapshot): Stock {
  const data = document.data()
  if (
    typeof data.symbol !== 'string' ||
    typeof data.companyName !== 'string' ||
    typeof data.sector !== 'string' ||
    typeof data.price !== 'number' ||
    typeof data.change !== 'number' ||
    typeof data.percentChange !== 'number' ||
    typeof data.volume !== 'number' ||
    typeof data.marketCap !== 'string' ||
    (data.peRatio !== null && typeof data.peRatio !== 'number') ||
    typeof data.fiftyTwoWeekHigh !== 'number' ||
    typeof data.fiftyTwoWeekLow !== 'number'
  ) {
    throw new Error(`Invalid stock document in Firestore: ${document.id}`)
  }

  return {
    documentId: document.id,
    symbol: data.symbol,
    companyName: data.companyName,
    sector: data.sector,
    price: data.price,
    change: data.change,
    percentChange: data.percentChange,
    volume: data.volume,
    marketCap: data.marketCap,
    peRatio: data.peRatio,
    fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: data.fiftyTwoWeekLow,
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __irStatusStore: StatusStore | undefined
}

function getStore() {
  if (!globalThis.__irStatusStore) {
    globalThis.__irStatusStore = { checks: [] }
  }
  return globalThis.__irStatusStore
}

export async function GET() {
  const store = getStore()
  const started = performance.now()
  let stocks: Stock[] = []
  let error: string | undefined

  try {
    const snapshot = await getAdminFirestore().collection(stocksCollection).get()
    stocks = snapshot.docs
      .map(toStock)
      .sort((left, right) => left.documentId.localeCompare(right.documentId))
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Firestore request failed'
    console.error('Firestore monitoring check failed:', error)
  }

  const latency = Math.round(performance.now() - started)
  const check: Check = { timestamp: new Date().toISOString(), latency, success: !error }
  store.checks = [...store.checks, check].slice(-1440)

  const successfulChecks = store.checks.filter((item) => item.success).length
  const averageLatency = Math.round(store.checks.reduce((sum, item) => sum + item.latency, 0) / store.checks.length)

  return NextResponse.json({
    uptime: Number(((successfulChecks / store.checks.length) * 100).toFixed(2)),
    averageLatency,
    totalChecks: store.checks.length,
    successfulChecks,
    failedChecks: store.checks.length - successfulChecks,
    latestTimestamp: check.timestamp,
    databaseStatus: error ? 'unavailable' : 'operational',
    history: store.checks,
    stocks,
    ...(error ? { error } : {}),
  }, { status: error ? 503 : 200 })
}

export async function POST() {
  try {
    const stockCollection = getAdminFirestore().collection(stocksCollection)
    const existingStocks = await stockCollection.get()
    const existingById = new Map(existingStocks.docs.map((stock) => [stock.id, stock.data()]))
    const stocksToUpload = mockStockData.filter((stock) => {
      const existing = existingById.get(stock.documentId)
      return !existing || Object.entries(stock).some(([field, value]) => existing[field] !== value)
    })

    if (stocksToUpload.length > 0) {
      const batch = getAdminFirestore().batch()
      for (const stock of stocksToUpload) {
        batch.set(stockCollection.doc(stock.documentId), stock, { merge: true })
      }
      await batch.commit()
    }

    return NextResponse.json({ uploaded: stocksToUpload.map((stock) => stock.documentId) })
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'Firestore stock upload failed'
    console.error('Firestore stock upload failed:', error)
    return NextResponse.json({ error }, { status: 503 })
  }
}
