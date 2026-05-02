import { AlertTriangle, TrendingUp, Users, MapPin, Gauge } from 'lucide-react';
import { type MonitoringArea } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface MostCriticalAreaProps {
  area: MonitoringArea;
  onClick: () => void;
}

export function MostCriticalArea({ area, onClick }: MostCriticalAreaProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-white shadow-xl shadow-red-900/20"
    >
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
      
      <div className="relative flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
              Priority Alert: High Impact
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-1">{area.name}</h2>
            <div className="flex items-center gap-1 opacity-70">
              <MapPin className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">{area.municipality}</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Impact Weight</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <p className="text-lg font-black tabular-nums">{area.populationAtRisk.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">System Momentum</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white" />
              <p className="text-lg font-black">{area.momentum.toFixed(1)}x</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
           <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mb-3">Risk DNA Signature</p>
           <div className="flex items-end gap-1.5 h-12">
             {area.causes.map((cause, i) => (
               <div key={i} className="flex-1 flex flex-col justify-end gap-1 group">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${cause.intensity}%` }}
                    className="w-full bg-white/30 rounded-t-sm transition-all group-hover:bg-white" 
                  />
                  <div className="h-0.5 w-full bg-white/10"></div>
               </div>
             ))}
             {/* Dynamic scaling for the DNA bars */}
             {[...Array(Math.max(0, 5 - area.causes.length))].map((_, i) => (
                <div key={i} className="flex-1 bg-white/5 h-[10%] rounded-t-sm" />
             ))}
           </div>
        </div>

        <div className="mt-8">
           <button 
             onClick={onClick}
             className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-[0.2em] text-red-600 transition-all hover:bg-red-50 hover:shadow-2xl active:scale-95 shadow-xl shadow-red-900/30"
           >
             FULL DIAGNOSTIC STACK
           </button>
        </div>
      </div>

      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none"
      />
    </motion.div>
  );
}
