import { useState, ReactNode } from 'react';
import { Shield, Clock, Activity, Settings, HelpCircle, User, Bell } from 'lucide-react';
import { RiskLevel, SystemMode } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface HeaderProps {
  status: RiskLevel;
  mode: SystemMode;
  confidence: number;
  globalRiskScore: number;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  decisionMode: 'citizen' | 'operator';
  onModeToggle: (mode: 'citizen' | 'operator') => void;
  isLiveConnected: boolean;
}

export function Header({
  status,
  mode,
  confidence,
  globalRiskScore,
  isSimulating,
  onToggleSimulation,
  decisionMode,
  onModeToggle,
  isLiveConnected
}: HeaderProps) {
  const statusConfig = {
    [RiskLevel.SAFE]: { label: 'NORMAL', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'check' },
    [RiskLevel.ATTENTION]: { label: 'VIGILÂNCIA', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'eye' },
    [RiskLevel.HIGH]: { label: 'ALERTA', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: 'warning' },
    [RiskLevel.CRITICAL]: { label: 'CRÍTICO', color: 'text-red-500', bg: 'bg-red-500/10', icon: 'warning' },
    [RiskLevel.EXTREME]: { label: 'EMERGÊNCIA', color: 'text-red-600', bg: 'bg-red-600/20', icon: 'warning' },
  };

  return (
    <header className="sticky top-0 z-[1000] flex h-20 w-full flex-col border-b border-gray-200 bg-[#1A2847] text-white px-6 shrink-0 shadow-2xl">
      <div className="flex flex-1 items-center justify-between">
        {/* A. Logo + Nome */}
        <div className="flex w-[250px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/50">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white">SIMA-RMR</h1>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-tight">Comando de Operações RMR</p>
          </div>
        </div>

        {/* B & C. Status & Toggle */}
        <div className="flex flex-1 items-center justify-center gap-8">
          {/* Status Global */}
          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[9px] font-bold text-blue-300 uppercase opacity-60">Situação Global</p>
                <div className="flex items-center gap-2">
                   <motion.div 
                     animate={status === RiskLevel.EXTREME ? { scale: [1, 1.2, 1] } : {}}
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     className={cn("h-2 w-2 rounded-full", statusConfig[status].bg.replace('/10', '').replace('/20', ''))} 
                   />
                   <span className={cn("text-xs font-black uppercase tracking-widest", statusConfig[status].color)}>
                     {statusConfig[status].label}
                   </span>
                </div>
             </div>
             <div className="h-8 w-[1px] bg-white/10 mx-2" />
             <div className="text-left font-mono text-[10px] opacity-60">
                <p>{new Date().toLocaleTimeString()}</p>
                <p>há 2s</p>
             </div>
          </div>

          {/* Modo Toggle */}
          <div className="flex rounded-full bg-black/20 p-1 border border-white/5 shadow-inner">
             <button 
               onClick={() => onModeToggle('citizen')}
               className={cn(
                 "rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                 decisionMode === 'citizen' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
               )}
             >
               Cidadão
             </button>
             <button 
               onClick={() => onModeToggle('operator')}
               className={cn(
                 "rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                 decisionMode === 'operator' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
               )}
             >
               Operador
             </button>
          </div>

          {/* D. Confiança Global */}
          <div className="group relative cursor-help">
            <div className="text-right">
              <p className="text-[9px] font-bold text-blue-300 uppercase opacity-60">Confiança</p>
              <p className="text-sm font-black text-emerald-400">{confidence}%</p>
            </div>

            <div className="absolute top-full right-0 mt-2 hidden w-48 rounded-xl bg-black/80 p-3 backdrop-blur-xl border border-white/10 shadow-2xl group-hover:block z-[1100]">
               <p className="text-[9px] font-black uppercase text-gray-400 mb-2 border-b border-white/10 pb-1">Detalhamento por Fonte</p>
               <div className="space-y-2">
                 <ConfidenceItem label="Modelo" value={94} />
                 <ConfidenceItem label="Sensor" value={91} />
                 <ConfidenceItem label="Comunidade" value={89} />
               </div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest",
              isLiveConnected
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                : "border-amber-400/40 bg-amber-500/20 text-amber-200"
            )}
          >
            {isLiveConnected ? 'Fonte: AO VIVO' : 'Fonte: SEM CONEXÃO AO VIVO'}
          </div>
        </div>

        {/* E & F. Events & Menu */}
        <div className="flex w-[300px] items-center justify-end gap-6">
           <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/50 transition-transform active:scale-90">
              <div className="text-center leading-none">
                 <p className="text-[8px] font-black">EVENTOO</p>
                 <p className="text-xs font-black">01</p>
              </div>
           </div>

           <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <NavIcon icon={<Settings className="h-4 w-4" />} />
              <NavIcon icon={<HelpCircle className="h-4 w-4" />} />
              <NavIcon icon={<User className="h-4 w-4" />} />
              <NavIcon icon={<Bell className="h-4 w-4" />} />
           </div>
        </div>
      </div>

      {/* Global Risk Bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/20">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${globalRiskScore}%` }}
          className={cn(
            "h-full transition-colors duration-1000",
            globalRiskScore > 80 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : 
            globalRiskScore > 50 ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
      </div>
    </header>
  );
}

function ConfidenceItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-gray-300">{label}</span>
      <span className="text-[10px] font-black text-emerald-400">{value}%</span>
    </div>
  );
}

function NavIcon({ icon }: { icon: ReactNode }) {
  return (
    <button className="text-blue-300 transition-colors hover:text-white">
      {icon}
    </button>
  );
}
