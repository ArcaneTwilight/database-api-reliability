import { NextResponse } from 'next/server'
import { GET as getStatus } from '../status/route'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

type StatusMetrics = {
  uptime: number
  averageLatency: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  latestTimestamp: string
  databaseStatus: string
}

export async function GET() {
  const statusResponse = await getStatus()
  const status = (await statusResponse.json()) as StatusMetrics

  return NextResponse.json({
    uptime: status.uptime,
    averageLatency: status.averageLatency,
    unit: 'ms',
    window: '24h',
    totalChecks: status.totalChecks,
    successfulChecks: status.successfulChecks,
    failedChecks: status.failedChecks,
    latestTimestamp: status.latestTimestamp,
    databaseStatus: status.databaseStatus,
  }, {
    status: statusResponse.status,
    headers: corsHeaders,
  })
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
