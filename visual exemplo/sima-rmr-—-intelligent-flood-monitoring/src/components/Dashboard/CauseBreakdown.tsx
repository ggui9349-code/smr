import { type MonitoringArea } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Info } from 'lucide-react';

interface CauseBreakdownProps {
  area: MonitoringArea | null;
}

export function CauseBreakdown({ area }: CauseBreakdownProps) {
  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
        <Info className="h-8 w-8 mb-3 opacity-20" />
        <p className="text-xs font-bold uppercase tracking-tight">Selecione uma área para ver o detalhamento</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
      <div className="mb-6">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#1a3a52]">Detalhamento de Causas</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{area.name} Inteligência</p>
      </div>

      <div className="space-y-6">
        {area.causes.map((cause, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1a3a52] uppercase tracking-tight">{cause.label}</span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                cause.intensity > 80 ? "text-red-600 bg-red-50" : 
                cause.intensity > 50 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50"
              )}>
                {cause.intensity}% IMPACT
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${cause.intensity}%` }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className={cn(
                  "h-full rounded-full",
                  cause.intensity > 80 ? "bg-red-500" : 
                  cause.intensity > 50 ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] font-bold text-gray-400 italic">
          <span>Signal Quality: High</span>
          <span>Validated by InSAR</span>
        </div>
      </div>
    </div>
  );
}
