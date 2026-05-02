import { RiskLevel, type MonitoringArea } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { Clock, TrendingUp, TrendingDown, Minus, Info, Crosshair } from 'lucide-react';

interface SidebarProps {
  areas: MonitoringArea[];
  selectedId: string;
  onSelect: (area: MonitoringArea) => void;
  onFocusArea?: (area: MonitoringArea) => void;
  onInspectArea?: (area: MonitoringArea) => void;
}

export function Sidebar({ areas, selectedId, onSelect, onFocusArea, onInspectArea }: SidebarProps) {
  const sortedAreas = [...areas].sort((a, b) => {
    // Sort by risk priority first, then by name
    const riskPriority = {
      [RiskLevel.EXTREME]: 0,
      [RiskLevel.CRITICAL]: 1,
      [RiskLevel.HIGH]: 2,
      [RiskLevel.ATTENTION]: 3,
      [RiskLevel.SAFE]: 4,
    };
    return riskPriority[a.riskLevel] - riskPriority[b.riskLevel];
  });

  return (
    <div className="flex h-full flex-col bg-[#1A2847] text-white">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 opacity-60 mb-2">Zonas de Monitoramento</h2>
        <div className="flex justify-between gap-1">
           <RiskBadge level={RiskLevel.EXTREME} count={areas.filter(a => a.riskLevel === RiskLevel.EXTREME).length} />
           <RiskBadge level={RiskLevel.CRITICAL} count={areas.filter(a => a.riskLevel === RiskLevel.CRITICAL).length} />
           <RiskBadge level={RiskLevel.HIGH} count={areas.filter(a => a.riskLevel === RiskLevel.HIGH).length} />
           <RiskBadge level={RiskLevel.ATTENTION} count={areas.filter(a => a.riskLevel === RiskLevel.ATTENTION).length} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {sortedAreas.map((area) => (
          <motion.div
            key={area.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(area)}
            className={cn(
              "group relative cursor-pointer rounded-xl bg-white/5 p-4 border border-white/5 transition-all duration-300",
              selectedId === area.id ? "bg-white/10 ring-2 ring-blue-500/50 border-blue-500/50" : "hover:bg-white/10"
            )}
          >
            {/* Severity Bar */}
            <div className={cn(
              "absolute left-0 top-0 h-full w-1 rounded-l-xl transition-all",
              getRiskColor(area.riskLevel),
              area.riskLevel === RiskLevel.EXTREME && "animate-pulse"
            )} />

            <div className="flex items-start justify-between">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[8px] font-black uppercase px-1 rounded", getRiskBadgeStyle(area.riskLevel))}>
                       {area.riskLevel}
                    </span>
                    <h4 className="text-xs font-black truncate max-w-[120px]">{area.name}</h4>
                 </div>
                 <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {area.eta}</span>
                    <span className="flex items-center gap-1">Nível: {area.rainIntensity.toFixed(1)}m</span>
                 </div>
              </div>
              <div className="text-right">
                 {getTrendIcon(area.trend)}
                 <p className="text-[10px] font-black mt-1">{area.trustScore}%</p>
              </div>
            </div>

            {selectedId === area.id && (
              <motion.div 
                layoutId="active-indicator"
                className="mt-3 flex gap-2"
              >
                 <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(area);
                      onFocusArea?.(area);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 rounded bg-blue-600 py-1.5 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700"
                 >
                    <Crosshair className="h-3 w-3" /> Focar
                 </button>
                 <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(area);
                      onInspectArea?.(area);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded bg-white/10 text-white transition-all hover:bg-white/20"
                 >
                    <Info className="h-3 w-3" />
                 </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5">
         <h4 className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-300 opacity-60 mb-4 flex justify-between items-center">
            EVOLUÇÃO (24h)
            <span className="text-[8px] bg-white/5 px-1 rounded">Collapse x</span>
         </h4>
         <div className="space-y-3">
            <TimelineItem time="20:03" type="warning" desc="Alerta | +10% em 5min" />
            <TimelineItem time="20:00" type="trend" desc="Taxa acelerou" />
            <TimelineItem time="19:55" type="alert" desc="Nível crítico atingido" />
         </div>
      </div>
    </div>
  );
}

function RiskBadge({ level, count }: { level: RiskLevel, count: number }) {
  return (
    <div className={cn(
      "flex flex-1 flex-col items-center justify-center py-1 rounded bg-black/20 border border-white/5",
      count > 0 ? "opacity-100" : "opacity-30"
    )}>
       <div className={cn("h-1 w-1 rounded-full mb-1", getRiskPointColor(level))} />
       <span className="text-[8px] font-black tracking-tighter opacity-60">{level[0].toUpperCase()}</span>
       <span className="text-[10px] font-black">{count}</span>
    </div>
  );
}

function TimelineItem({ time, type, desc }: { time: string, type: string, desc: string }) {
  return (
    <div className="flex gap-3 text-[10px] group cursor-default">
       <span className="font-mono text-gray-500 group-hover:text-blue-400 transition-colors shrink-0">{time}</span>
       <span className="font-medium text-gray-400 truncate">{desc}</span>
    </div>
  );
}

function getRiskColor(level: RiskLevel) {
  switch (level) {
    case RiskLevel.SAFE: return 'bg-emerald-500';
    case RiskLevel.ATTENTION: return 'bg-amber-500';
    case RiskLevel.HIGH: return 'bg-orange-500';
    case RiskLevel.CRITICAL: return 'bg-red-500';
    case RiskLevel.EXTREME: return 'bg-red-600';
  }
}

function getRiskPointColor(level: RiskLevel) {
  switch (level) {
    case RiskLevel.SAFE: return 'bg-emerald-500';
    case RiskLevel.ATTENTION: return 'bg-amber-500';
    case RiskLevel.HIGH: return 'bg-orange-500';
    case RiskLevel.CRITICAL: return 'bg-red-500';
    case RiskLevel.EXTREME: return 'bg-red-600';
  }
}

function getRiskBadgeStyle(level: RiskLevel) {
  switch (level) {
    case RiskLevel.SAFE: return 'bg-emerald-500/20 text-emerald-500';
    case RiskLevel.ATTENTION: return 'bg-amber-500/20 text-amber-500';
    case RiskLevel.HIGH: return 'bg-orange-500/20 text-orange-500';
    case RiskLevel.CRITICAL: return 'bg-red-500/20 text-red-500';
    case RiskLevel.EXTREME: return 'bg-red-600 text-white';
  }
}

function getTrendIcon(trend: 'rising' | 'stable' | 'falling') {
  switch (trend) {
    case 'rising': return <TrendingUp className="h-3 w-3 text-red-500" />;
    case 'stable': return <Minus className="h-3 w-3 text-gray-500" />;
    case 'falling': return <TrendingDown className="h-3 w-3 text-emerald-500" />;
  }
}
