'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatBRL } from '@/lib/format/money'

interface RevenueChartPoint {
  date: string
  label: string
  netCents: number
}

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="revenue-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#eaa83a"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="#eaa83a"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="rgba(255,255,255,0.07)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="#8b8b96"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            stroke="#8b8b96"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={64}
            tickFormatter={(value: number) => formatBRL(value)}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.16)' }}
            contentStyle={{
              background: '#1c1d22',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#f4f4f5',
              fontSize: 12,
            }}
            formatter={(value) => [formatBRL(Number(value)), 'Receita']}
            labelFormatter={(label) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="netCents"
            stroke="#eaa83a"
            strokeWidth={2}
            fill="url(#revenue-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
