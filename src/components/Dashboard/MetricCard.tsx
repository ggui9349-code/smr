import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  citizenLabel?: string;
  value: string | number;
  icon: ReactNode;
  iconBg: string;
  trend?: string;
  isCritical?: boolean;
  decisionMode?: 'technical' | 'citizen';
}

export function MetricCard({ label, citizenLabel, value, icon, iconBg, trend, isCritical, decisionMode = 'technical' }: MetricCardProps) {
  const displayLabel = decisionMode === 'citizen' && citizenLabel ? citizenLabel : label;

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white/70 p-6 shadow-sm transition-all hover:shadow-2xl border border-white/50 backdrop-blur-md",
        isCritical && "bg-red-50/50 border-red-100"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{displayLabel}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={cn(
              "text-3xl font-black tracking-tight text-[#1a3a52] tabular-nums",
              isCritical && "text-red-600"
            )}>
              {decisionMode === 'citizen' && typeof value === 'string' && value.includes('mm/h') ? (parseFloat(value) > 30 ? 'Heavy Rain' : 'Moderate Rain') : value}
            </h3>
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 pt-1">
               <div className={cn(
                 "h-1 w-1 rounded-full",
                 trend.includes('+') ? "bg-red-500" : "bg-emerald-500"
               )}></div>
               <p className={cn(
                 "text-[10px] font-bold uppercase tracking-tight",
                 trend.includes('+') ? "text-red-500" : "text-emerald-500"
               )}>
                 {trend}
               </p>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-xl", 
          iconBg,
          isCritical && "animate-pulse"
        )}>
          {icon}
        </div>
      </div>
      
      {isCritical && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-red-500 pointer-events-none"
        />
      )}
      
      <div className="absolute -bottom-2 -right-2 opacity-[0.03] scale-150 rotate-12 group-hover:scale-175 transition-transform duration-700">
         {icon}
      </div>
    </motion.div>
  );
}
