"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const data = [
  { name: 'Jan', commissions: 50000 },
  { name: 'Fév', commissions: 70000 },
  { name: 'Mar', commissions: 60000 },
  { name: 'Avr', commissions: 90000 },
  { name: 'Mai', commissions: 120000 },
  { name: 'Juin', commissions: 150000 },
];

export default function AgentCharts() {
  return (
    <div className="w-full h-80 bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm mt-8 mb-8">
      <h2 className="text-xl font-bold text-stone-900 mb-6">Évolution des Commissions (BIF)</h2>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [Number(value || 0).toLocaleString() + ' BIF', 'Commission']}
          />
          <Line type="monotone" dataKey="commissions" stroke="#023E2A" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
