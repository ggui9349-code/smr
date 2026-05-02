import { motion } from 'motion/react';
import { ShieldCheck, Users, School, Building2, CarFront, ChevronRight, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MonitoringArea } from '../../types';

interface OperationalDeckProps {
  areas: MonitoringArea[];
  onSelect: (area: MonitoringArea) => void;
}

export function OperationalDeck({ areas, onSelect }: OperationalDeckProps) {
  const rankedAreas = [...areas].sort((a, b) => b.operationalPriority - a.operationalPriority);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1a3a52]">Motor Operacional</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Índice de Prioridade Tática</p>
          </div>
        </div>
        <div className="flex -space-x-2">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-gray-200" />
           ))}
        </div>
      </div>

      <div className="grid gap-4">
        {rankedAreas.map((area, idx) => (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(area)}
            className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className={cn(
                   "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black",
                   idx === 0 ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : "bg-gray-100 text-gray-500"
                 )}>
                   #{idx + 1}
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-[#1a3a52]">{area.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{area.municipality}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-black uppercase text-gray-400 mb-0.5">Prioridade</p>
                 <p className={cn(
                   "text-lg font-black leading-none",
                   area.operationalPriority > 80 ? "text-red-600" : "text-blue-600"
                 )}>{area.operationalPriority}%</p>
              </div>
            </div>

            {/* Urban Impact Matrix */}
            <div className="grid grid-cols-4 gap-2 mb-4">
               <ImpactBadge icon={<School className="h-3 w-3" />} value={area.urbanImpact.schools} label="Escolas" />
               <ImpactBadge icon={<Building2 className="h-3 w-3" />} value={area.urbanImpact.hospitals} label="Hospitais" />
               <ImpactBadge icon={<Users className="h-3 w-3" />} value={area.assignedTeams || 0} label="Equipes" isHigh />
               <ImpactBadge icon={<CarFront className="h-3 w-3" />} value={area.urbanImpact.blockedRoads.length} label="Vias" />
            </div>

            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Índice de Confiança: {area.trustScore}%</span>
               </div>
               <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <button className="mt-auto w-full rounded-2xl border-2 border-dashed border-gray-200 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-500">
        Gerar Relatório Operacional Completo
      </button>
    </div>
  );
}

function ImpactBadge({ icon, value, label, isHigh }: { icon: any, value: number, label: string, isHigh?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl p-2 transition-colors",
      value > 0 ? (isHigh ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600") : "bg-gray-50 text-gray-400"
    )}>
      {icon}
      <span className="mt-1 text-[10px] font-black">{value}</span>
    </div>
  );
}
