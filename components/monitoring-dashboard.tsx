'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, ArrowDownRight, ArrowUpRight, Database, RefreshCw, Server, ShieldCheck, TimerReset } from 'lucide-react'
import type { Stock } from '@/lib/stocks'

type DashboardData = {
  uptime: number
  averageLatency: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  latestTimestamp: string
  databaseStatus: string
  history: Array<{ timestamp: string; latency: number; success: boolean }>
  stocks: Stock[]
  error?: string
}

const initialData: DashboardData = {
  uptime: 0,
  averageLatency: 0,
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  latestTimestamp: '',
  databaseStatus: 'checking',
  history: [],
  stocks: [],
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(value))
}

export default function MonitoringDashboard() {
  const [data, setData] = useState<DashboardData>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [seedError, setSeedError] = useState('')
  const [statusError, setStatusError] = useState('')

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/status', { cache: 'no-store' })
      const result: DashboardData = await response.json()
      setData(result)
      setStatusError(response.ok ? '' : result.error ?? 'Firestore monitoring request failed')
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Monitoring request failed')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/status', { method: 'POST', cache: 'no-store' })
        const result: { error?: string } = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Could not upload mock stocks to Firestore')
      } catch (error) {
        if (!cancelled) setSeedError(error instanceof Error ? error.message : 'Could not upload mock stocks to Firestore')
      } finally {
        if (!cancelled) void refresh()
      }
    })()
    const interval = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(interval)
  }, [refresh])

  const chartData = useMemo(() => data.history.map((item, index) => ({ ...item, label: index === data.history.length - 1 ? 'now' : formatTime(item.timestamp), uptime: item.success ? 100 : 0 })), [data.history])
  const lastCheck = data.history[data.history.length - 1]
  const displayedError = seedError || statusError

  return (
    <main className="min-h-screen bg-[#f5f7f9] text-[#182230]">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#dce3e9] pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold tracking-[0.12em] text-[#587083] uppercase"><span className="grid size-8 place-items-center rounded-lg bg-[#183a4a] text-white"><Activity size={17} /></span> IR Data Monitor</div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#15202b] sm:text-4xl">API Health Overview</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#647584]">Live observability for the investor relations stock data service and its Firestore connection.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-[#cde8d8] bg-[#f4fcf7] px-3 py-2 text-xs font-semibold text-[#237a4b]"><span className="size-2 rounded-full bg-[#35b86f]" /> Monitoring active</span>
            <button onClick={refresh} disabled={isRefreshing} className="inline-flex items-center gap-2 rounded-lg border border-[#ccd7df] bg-white px-3.5 py-2.5 text-sm font-medium text-[#314354] shadow-sm transition hover:border-[#8ca2b0] disabled:opacity-60"><RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} /> Refresh</button>
          </div>
        </header>

        <section aria-label="Current metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Current uptime" value={data.totalChecks ? `${data.uptime}%` : '—'} detail={`${data.successfulChecks} successful / ${data.totalChecks} checks`} icon={<ShieldCheck size={19} />} tone="green" />
          <MetricCard label="Average latency" value={data.totalChecks ? `${data.averageLatency} ms` : '—'} detail="Across the last 24h" icon={<TimerReset size={19} />} tone="blue" />
          <MetricCard label="Last checked" value={lastCheck ? formatTime(lastCheck.timestamp) : '—'} detail={lastCheck ? 'Just now · auto-refresh 1m' : 'Waiting for first check'} icon={<Activity size={19} />} tone="amber" />
          <MetricCard label="Database status" value={data.databaseStatus} detail={`Firestore · ${data.stocks.length} documents`} icon={<Database size={19} />} tone={data.databaseStatus === 'operational' ? 'green' : 'amber'} />
        </section>
        {displayedError && <p role="alert" className="mt-4 rounded-lg border border-[#f0d1d1] bg-[#fff5f5] px-4 py-3 text-sm text-[#a33f44]">Firestore issue: {displayedError}</p>}

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <ChartCard title="Uptime history" subtitle="Successful request timeline" badge={`${data.failedChecks} failed`}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="uptimeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43bf7d" stopOpacity={0.28} /><stop offset="100%" stopColor="#43bf7d" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7edf0" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8494a0' }} tickLine={false} axisLine={false} minTickGap={26} /><YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 10, fill: '#8494a0' }} tickLine={false} axisLine={false} unit="%" /><Tooltip content={<ChartTooltip suffix="%" />} /><Area type="stepAfter" dataKey="uptime" stroke="#36ae70" strokeWidth={2} fill="url(#uptimeFill)" /></AreaChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Latency / ping" subtitle="Round-trip response time" badge={`${data.averageLatency} ms avg`}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}><defs><linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5799c4" stopOpacity={0.27} /><stop offset="100%" stopColor="#5799c4" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e7edf0" /><XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8494a0' }} tickLine={false} axisLine={false} minTickGap={26} /><YAxis tick={{ fontSize: 10, fill: '#8494a0' }} tickLine={false} axisLine={false} unit=" ms" /><Tooltip content={<ChartTooltip suffix=" ms" />} /><Area type="monotone" dataKey="latency" stroke="#468bb9" strokeWidth={2} fill="url(#latencyFill)" /></AreaChart></ResponsiveContainer>
          </ChartCard>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl border border-[#dce3e9] bg-white p-5 shadow-[0_3px_18px_rgba(24,34,48,0.035)] sm:p-6">
            <div className="mb-5 flex items-start justify-between"><div><h2 className="font-semibold text-[#1b2a38]">Stock collection</h2><p className="mt-1 text-xs text-[#7a8a96]">Latest documents returned from Firestore</p></div><span className="rounded-md bg-[#eff5f7] px-2.5 py-1 text-xs font-medium text-[#557180]">{data.stocks.length} records</span></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-[#e7edf0] text-[11px] font-semibold tracking-wider text-[#8a9aa5] uppercase"><tr><th className="pb-3 font-semibold">Symbol</th><th className="pb-3 font-semibold">Company</th><th className="pb-3 font-semibold">Sector</th><th className="pb-3 text-right font-semibold">Price</th><th className="pb-3 text-right font-semibold">Change</th></tr></thead><tbody className="divide-y divide-[#edf1f3]">{data.stocks.map((stock) => <tr key={stock.symbol}><td className="py-4 font-semibold text-[#1c6c80]">{stock.symbol}</td><td className="py-4 font-medium text-[#314354]">{stock.companyName}</td><td className="py-4 text-[#82909a]">{stock.sector}</td><td className="py-4 text-right font-medium text-[#314354]">${stock.price.toFixed(2)}</td><td className={`py-4 text-right font-medium ${stock.change < 0 ? 'text-[#c45c60]' : 'text-[#27915b]'}`}>{stock.change < 0 ? <ArrowDownRight className="mr-1 inline" size={14} /> : <ArrowUpRight className="mr-1 inline" size={14} />}{stock.change.toFixed(2)}%</td></tr>)}</tbody></table></div>
          </div>
          <div className="rounded-xl border border-[#dce3e9] bg-[#173544] p-6 text-white shadow-[0_3px_18px_rgba(24,34,48,0.08)]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-white/10 text-[#78d09d]"><Server size={20} /></span><div><h2 className="font-semibold">Service details</h2><p className="text-xs text-[#a5bcc7]">Backend endpoint summary</p></div></div><dl className="mt-7 space-y-5 text-sm"><div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-[#a5bcc7]">Endpoint</dt><dd className="font-mono text-xs text-[#e4f1f3]">/api/status</dd></div>          <div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-[#a5bcc7]">Check interval</dt><dd>1 minute</dd></div>          <div className="flex justify-between gap-4 border-b border-white/10 pb-4"><dt className="text-[#a5bcc7]">History window</dt><dd>24 hours · 1,440 checks</dd></div><div className="flex justify-between gap-4"><dt className="text-[#a5bcc7]">Last response</dt><dd className={statusError ? 'text-[#f5a0a0]' : 'text-[#7cdaa0]'}>{data.totalChecks ? statusError ? 'Firestore error' : '200 OK' : 'Waiting'}</dd></div></dl></div>        </section>        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-[#dce3e9] pt-5 text-xs text-[#84939d] sm:flex-row"><span>IR Data Monitor · v1.0</span><span>Last refreshed {data.latestTimestamp ? formatTime(data.latestTimestamp) : '—'}</span></footer>
      </div>
    </main>
  )
}

function MetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: 'green' | 'blue' | 'amber' }) {
  const styles = { green: 'bg-[#effaf3] text-[#2c9b61]', blue: 'bg-[#eef6fb] text-[#4489b5]', amber: 'bg-[#fff8eb] text-[#c18a32]' }
  return <div className="rounded-xl border border-[#dce3e9] bg-white p-5 shadow-[0_3px_18px_rgba(24,34,48,0.035)]"><div className="flex items-center justify-between"><span className="text-xs font-semibold tracking-wide text-[#7b8b96] uppercase">{label}</span><span className={`grid size-9 place-items-center rounded-lg ${styles[tone]}`}>{icon}</span></div><div className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-[#1a2b39]">{value}</div><p className="mt-1 text-xs text-[#8897a1]">{detail}</p></div>
}

function ChartCard({ title, subtitle, badge, children }: { title: string; subtitle: string; badge: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#dce3e9] bg-white p-5 shadow-[0_3px_18px_rgba(24,34,48,0.035)] sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold text-[#1b2a38]">{title}</h2><p className="mt-1 text-xs text-[#7a8a96]">{subtitle}</p></div><span className="rounded-md bg-[#f3f6f8] px-2.5 py-1 text-xs font-medium text-[#6e7f8a]">{badge}</span></div><div className="mt-6 h-[220px]">{children}</div></div>
}

function ChartTooltip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return <div className="rounded-lg border border-[#dce3e9] bg-white px-3 py-2 shadow-lg"><p className="text-[10px] text-[#84939d]">{label}</p><p className="mt-1 text-sm font-semibold text-[#1c6c80]">{payload[0].value}{suffix}</p></div>
}
