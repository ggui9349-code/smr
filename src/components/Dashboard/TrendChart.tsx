import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { type HistoricalData } from '../../types';

interface TrendChartProps {
  data: HistoricalData[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-full w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#1a3a52]">Risk vs Rain Evolution</h2>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">Last 24-hour cycle summary</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
             <div className="h-2 w-2 rounded-full bg-blue-500"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase">Rain (mm)</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="h-2 w-2 rounded-full bg-red-500"></div>
             <span className="text-[10px] font-bold text-gray-400 uppercase">Risk Level (%)</span>
           </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
            />
            <Area type="monotone" dataKey="rain" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" />
            <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
