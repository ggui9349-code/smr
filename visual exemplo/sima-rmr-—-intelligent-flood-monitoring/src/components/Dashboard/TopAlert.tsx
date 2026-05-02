import { AlertTriangle, ChevronDown, ChevronUp, Clock, Users, Activity, CheckSquare, Square } from 'lucide-react';
import { RiskLevel, type MonitoringArea } from '../../types';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface TopAlertProps {
  area: MonitoringArea;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isLiveConnected: boolean;
}

export function TopAlert({ area, isCollapsed, onToggleCollapse, isLiveConnected }: TopAlertProps) {
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const toggleAction = (action: string) => {
    setCompletedActions(prev => 
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: isCollapsed ? 60 : 'auto', opacity: 1 }}
      className={cn(
        "relative w-full border-b-4 overflow-hidden transition-all duration-500",
        area.riskLevel === RiskLevel.EXTREME ? "bg-gradient-to-r from-red-950 to-red-900 border-red-600" : "bg-orange-950 border-orange-500"
      )}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 animate-pulse shadow-lg shadow-red-500/50">
                <AlertTriangle className="h-5 w-5" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                   PRIORIDADE MÁXIMA: {area.causes[0]?.label.toUpperCase() || 'ALERTA CRÍTICO'}
                   <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-black text-white">R4 EXTREME</span>
                </h2>
                {isCollapsed && (
                  <p className="text-[10px] font-bold text-red-100/60 uppercase tracking-widest mt-0.5">
                    {area.name} | ETA: {area.eta} | Impacto: {area.populationAtRisk.toLocaleString()} pessoas
                  </p>
                )}
             </div>
          </div>
          <button 
            onClick={onToggleCollapse}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
             {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
             <div>
                <p className="text-[9px] font-black text-red-100/40 uppercase tracking-widest mb-1">LOCAL OPERACIONAL</p>
                <h3 className="text-lg font-black text-white tracking-widest">{area.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-red-100/60 uppercase">
                   <Clock className="h-3.5 w-3.5" /> ETA: {area.eta}
                   <Activity className="h-3.5 w-3.5 ml-2" /> Taxa: +8.4 cm/h
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div>
                   <p className="text-[9px] font-black text-red-100/40 uppercase tracking-widest mb-1">Impacto Populacional</p>
                   <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-red-400" />
                      <span className="text-xl font-black text-white">{area.populationAtRisk.toLocaleString()}</span>
                   </div>
                </div>
                <div>
                   <p className="text-[9px] font-black text-red-100/40 uppercase tracking-widest mb-1">Drenagem</p>
                   <span className="text-xl font-black text-red-400">95% SATURADA</span>
                </div>
             </div>

             <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[9px] font-black text-red-100/40 uppercase tracking-widest">AÇÕES RECOMENDADAS (IA)</p>
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                      isLiveConnected
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-amber-500/20 text-amber-200"
                    )}
                  >
                    {isLiveConnected ? 'ALERTA AO VIVO' : 'SEM SINAL AO VIVO'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                   {area.recommendations.map(action => (
                     <button 
                       key={action}
                       onClick={() => toggleAction(action)}
                       className={cn(
                         "flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-all",
                         completedActions.includes(action) 
                           ? "bg-emerald-500 text-white shadow-lg" 
                           : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                       )}
                     >
                        {completedActions.includes(action) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        {action}
                     </button>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </div>

      {/* Pulse Effect Background */}
      {area.riskLevel === RiskLevel.EXTREME && (
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-red-600/10 pointer-events-none"
        />
      )}
    </motion.div>
  );
}
