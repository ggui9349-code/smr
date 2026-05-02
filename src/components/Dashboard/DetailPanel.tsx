import { useState, useEffect, useMemo } from 'react';
import { RiskLevel, type MonitoringArea } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Users, School, Building2, CarFront, History, ClipboardList, Target } from 'lucide-react';

interface DetailPanelProps {
  area: MonitoringArea;
  onRequestMapFocus?: (area: MonitoringArea) => void;
  inspectNonce?: number;
}

type TabType = 'Visão Geral' | 'Ações' | 'DNA de Risco' | 'Impacto' | 'Histórico';

export function DetailPanel({ area, onRequestMapFocus, inspectNonce = 0 }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Visão Geral');
  const [actionStateByArea, setActionStateByArea] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (inspectNonce > 0) {
      setActiveTab('Visão Geral');
    }
  }, [inspectNonce]);

  const tabs: TabType[] = ['Visão Geral', 'Ações', 'DNA de Risco', 'Impacto', 'Histórico'];

  return (
    <div className="flex h-full flex-col bg-[#1D2A47] text-white">
      <div className="p-6 border-b border-white/5">
        <div className="mb-2 flex items-center gap-2">
           <div className={cn(
             "h-2 w-2 rounded-full",
             area.riskLevel === RiskLevel.EXTREME ? "bg-red-600 animate-pulse" : 
             area.riskLevel === RiskLevel.CRITICAL ? "bg-red-500" : "bg-orange-500"
           )} />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 opacity-60">ZONA EM FOCO</p>
        </div>
        <h2 className="text-xl font-black tracking-widest">{area.name.toUpperCase()}</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {area.municipality} | UR-1 | {area.classification}
        </p>
      </div>

      <div className="border-b border-white/5 px-2">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "text-blue-400" : "text-gray-500 hover:text-white"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500"
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex justify-end pb-2 pr-2">
          <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-blue-200">
            Fonte: Open-Meteo (tempo real) + IA Gemini (enriquecimento)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'Visão Geral' && <OverviewTab area={area} />}
            {activeTab === 'Ações' && (
              <ActionsTab
                area={area}
                actionState={actionStateByArea[area.id] ?? {}}
                onToggleAction={(action) => {
                  setActionStateByArea((prev) => ({
                    ...prev,
                    [area.id]: {
                      ...(prev[area.id] ?? {}),
                      [action]: !(prev[area.id]?.[action] ?? false),
                    },
                  }));
                }}
              />
            )}
            {activeTab === 'DNA de Risco' && <RiskDNATab area={area} />}
            {activeTab === 'Impacto' && <ImpactTab area={area} />}
            {activeTab === 'Histórico' && <HistoryTab area={area} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-white/5 flex gap-2">
        <button
          onClick={() => onRequestMapFocus?.(area)}
          className="flex-1 rounded-xl bg-blue-600 py-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
        >
           Mapa Zoom
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ area }: { area: MonitoringArea }) {
  return (
    <div className="space-y-8">
       <div className="grid grid-cols-2 gap-6">
          <div>
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
             <p className="text-sm font-black">{translateRiskLevel(area.riskLevel)}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nível Atual</p>
             <p className="text-sm font-black">{area.rainIntensity.toFixed(2)}m</p>
          </div>
       </div>

       <div className="rounded-2xl bg-black/20 p-5 border border-white/5 shadow-inner">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">ETA AGRAVAMENTO</p>
             </div>
             <p className="text-3xl font-black tracking-tighter text-white">{area.eta.replace('min', '')}<span className="text-xs font-bold text-gray-500 ml-1">MIN</span></p>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '75%' }}
               className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
             />
          </div>
       </div>

       <div className="space-y-4">
          <DetailItem label="População" value={area.populationAtRisk.toLocaleString()} icon={<Users className="h-4 w-4 text-orange-400" />} />
          <DetailItem label="Tendência" value={translateTrend(area.trend)} icon={<Activity className="h-4 w-4 text-emerald-400" />} />
          <DetailItem label="Confiança" value={`${area.confidence.toFixed(1)}%`} icon={<Shield className="h-4 w-4 text-blue-400" />} />
       </div>
    </div>
  );
}

function ActionsTab({
  area,
  actionState,
  onToggleAction,
}: {
  area: MonitoringArea;
  actionState: Record<string, boolean>;
  onToggleAction: (action: string) => void;
}) {
  const completedCount = useMemo(
    () => area.recommendations.filter((action) => actionState[action]).length,
    [area.recommendations, actionState]
  );

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 shadow-lg shadow-orange-900/50">
             <ClipboardList className="h-6 w-6" />
          </div>
          <div>
             <h4 className="text-sm font-black uppercase tracking-widest">Ações Recomendadas</h4>
             <p className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">Motor de risco operacional</p>
             <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-blue-200/80">
               {completedCount}/{area.recommendations.length} concluídas
             </p>
          </div>
       </div>

       <div className="space-y-3">
          {area.recommendations.map((action, i) => {
            const isDone = !!actionState[action];

            return (
              <button
                type="button"
                key={i}
                onClick={() => onToggleAction(action)}
                className={cn(
                  "flex w-full gap-4 p-4 rounded-2xl border transition-colors cursor-pointer group text-left",
                  isDone
                    ? "bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/15"
                    : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                 <div className={cn(
                   "h-5 w-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors",
                   isDone ? "border-emerald-400 bg-emerald-400/20" : "border-white/20 group-hover:border-blue-500"
                 )}>
                    <div className={cn(
                      "h-2 w-2 rounded transition-opacity",
                      isDone ? "bg-emerald-400 opacity-100" : "bg-blue-500 opacity-0 group-hover:opacity-100"
                    )} />
                 </div>
                 <p className={cn("text-xs font-bold", isDone ? "text-emerald-200" : "text-gray-200")}>{action}</p>
              </button>
            );
          })}
       </div>

       <div className="pt-6 border-t border-white/5">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">RECURSOS OPERACIONAIS</p>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[8px] font-bold text-blue-300 uppercase mb-1">Equipes</p>
                <p className="text-lg font-black">{area.assignedTeams}</p>
             </div>
             <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <p className="text-[8px] font-bold text-blue-300 uppercase mb-1">Status</p>
                <p className="text-[10px] font-black uppercase text-emerald-400">{area.playbookStatus}</p>
             </div>
          </div>
       </div>
    </div>
  );
}

function RiskDNATab({ area }: { area: MonitoringArea }) {
  return (
    <div className="space-y-8">
       <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 opacity-60 mb-6">Assinatura de Risco</h4>
          <div className="space-y-6">
             {area.causes.map((cause, i) => (
               <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{cause.label}</span>
                     <span className="text-xs font-black text-white">{cause.intensity}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${cause.intensity}%` }}
                       className={cn(
                         "h-full rounded-full",
                         cause.intensity > 80 ? "bg-red-500" : cause.intensity > 50 ? "bg-orange-500" : "bg-blue-500"
                       )} 
                     />
                  </div>
               </div>
             ))}
          </div>
       </div>

       <div className="rounded-2xl bg-white/5 p-5 border border-white/5 italic text-xs text-gray-400 leading-relaxed">
          "Assinatura baseada em chuva acumulada (120mm/3h) + maré alta (1.2m). Drenagem local reportada em 95% de saturação."
       </div>
    </div>
  );
}

function ImpactTab({ area }: { area: MonitoringArea }) {
  return (
    <div className="space-y-6">
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 opacity-60 mb-6">Impacto Urbano Crítico</h4>
       
       <div className="grid grid-cols-2 gap-4">
          <ImpactCard icon={<School className="h-5 w-5 text-blue-500" />} label="Escolas" value={area.urbanImpact.schools} sub="2.43k Alunos" />
          <ImpactCard icon={<Building2 className="h-5 w-5 text-emerald-500" />} label="Hospitais" value={area.urbanImpact.hospitals} sub="Urgência Fixa" />
          <ImpactCard icon={<CarFront className="h-5 w-5 text-amber-500" />} label="Vias Bloqueadas" value={area.urbanImpact.blockedRoads.length} sub="Rotas Alternativas" />
          <ImpactCard icon={<Users className="h-5 w-5 text-orange-500" />} label="Vulneráveis" value="2,100" sub="Zona Alta" />
       </div>

       {area.urbanImpact.blockedRoads.length > 0 && (
         <div className="mt-4 p-4 rounded-2xl bg-red-950/20 border border-red-500/20">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">BLOQUEIOS ATIVOS</p>
            <ul className="space-y-1">
               {area.urbanImpact.blockedRoads.map(road => (
                 <li key={road} className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-red-500" />
                    {road}
                 </li>
               ))}
            </ul>
         </div>
       )}
    </div>
  );
}

function HistoryTab({ area }: { area: MonitoringArea }) {
  return (
    <div className="space-y-8">
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 opacity-60 mb-6 font-sans">Timeline de Eventos (24h)</h4>
       
       <div className="relative pl-6 space-y-8 border-l border-white/5">
          {area.history.map((event, i) => (
            <div key={i} className="relative">
               <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#1D2A47] ring-4 ring-[#1D2A47]">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    event.type === 'alert' ? 'bg-red-500' : event.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
               </div>
               <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black font-mono text-gray-500">{event.time}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-400/60">{translateEventType(event.type)}</span>
               </div>
               <p className="text-xs font-bold text-gray-300 leading-snug">{event.description}</p>
            </div>
          ))}
          {area.history.length === 0 && (
             <p className="text-xs font-bold text-gray-500 italic">Nenhum evento registrado nas últimas 24h.</p>
          )}
       </div>
    </div>
  );
}

function ImpactCard({ icon, label, value, sub }: { icon: any, label: string, value: any, sub: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
       <div className="mb-3 flex items-center justify-between">
          {icon}
          <span className="text-lg font-black group-hover:text-blue-400 transition-colors">{value}</span>
       </div>
       <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{label}</p>
       <p className="text-[8px] font-bold text-gray-600 mt-0.5">{sub}</p>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
       <div className="flex items-center gap-3">
          {icon}
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-xs font-black">{value}</span>
    </div>
  );
}

function translateTrend(trend: 'rising' | 'stable' | 'falling'): string {
  switch (trend) {
    case 'rising':
      return 'SUBINDO';
    case 'falling':
      return 'CAINDO';
    default:
      return 'ESTÁVEL';
  }
}

function translateEventType(type: 'alert' | 'warning' | 'trend'): string {
  switch (type) {
    case 'alert':
      return 'ALERTA';
    case 'warning':
      return 'ATENÇÃO';
    default:
      return 'TENDÊNCIA';
  }
}

function translateRiskLevel(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.SAFE:
      return 'NORMAL';
    case RiskLevel.ATTENTION:
      return 'ATENÇÃO';
    case RiskLevel.HIGH:
      return 'ALTO';
    case RiskLevel.CRITICAL:
      return 'CRÍTICO';
    case RiskLevel.EXTREME:
      return 'EXTREMO';
    default:
      return 'INDEFINIDO';
  }
}
