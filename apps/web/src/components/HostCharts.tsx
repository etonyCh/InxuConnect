"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const data = [
  { name: 'Jan', revenue: 150000 },
  { name: 'Fév', revenue: 200000 },
  { name: 'Mar', revenue: 180000 },
  { name: 'Avr', revenue: 250000 },
  { name: 'Mai', revenue: 300000 },
  { name: 'Juin', revenue: 450000 },
];

export default function HostCharts() {
  return (
    <div className="w-full h-80 bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm mt-8 mb-8">
      <h2 className="text-xl font-bold text-stone-900 mb-6">Revenus Mensuels (BIF)</h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 0,
          }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f5f5f4' }}
            formatter={(value: any) => [Number(value || 0).toLocaleString() + ' BIF', 'Revenu']}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#023E2A' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
