"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const data = [
  { name: 'Jan', users: 40, bookings: 24 },
  { name: 'Fév', users: 30, bookings: 13 },
  { name: 'Mar', users: 20, bookings: 98 },
  { name: 'Avr', users: 27, bookings: 39 },
  { name: 'Mai', users: 18, bookings: 48 },
  { name: 'Juin', users: 23, bookings: 38 },
  { name: 'Juil', users: 34, bookings: 43 },
];

export default function AdminCharts() {
  return (
    <div className="w-full h-80 bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm mt-8 mb-8">
      <h2 className="text-xl font-bold text-stone-900 mb-6">Évolution des Inscriptions & Réservations</h2>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#023E2A" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#023E2A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" />
          <Area type="monotone" dataKey="bookings" stroke="#023E2A" fillOpacity={1} fill="url(#colorBookings)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
