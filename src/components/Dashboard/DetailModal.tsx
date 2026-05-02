import { X, Users, Home, TrendingUp, AlertTriangle, School, Building2, CarFront, Activity } from 'lucide-react';
import { RiskLevel, type MonitoringArea } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface DetailModalProps {
  area: MonitoringArea | null;
  onClose: () => void;
}

function translateTrend(trend: 'rising' | 'stable' | 'falling') {
  if (trend === 'rising') return 'SUBINDO';
  if (trend === 'stable') return 'ESTÁVEL';
  return 'CAINDO';
}

export function DetailModal({ area, onClose }: DetailModalProps) {
  if (!area) return null;

  const getRiskBg = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.SAFE: return 'bg-emerald-500';
      case RiskLevel.ATTENTION: return 'bg-amber-500';
      case RiskLevel.HIGH: return 'bg-orange-500';
      case RiskLevel.CRITICAL: return 'bg-red-500';
      case RiskLevel.EXTREME: return 'bg-black';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className={cn("px-8 py-6 text-white flex justify-between items-start", getRiskBg(area.riskLevel))}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Análise da Área</p>
              <h2 className="text-3xl font-bold tracking-tight">{area.name}</h2>
              <div className="mt-2 flex items-center gap-3">
                 <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold uppercase backdrop-blur-md">
                   {area.classification}
                 </span>
                 <span className="flex items-center gap-1 text-xs font-bold uppercase">
                   <TrendingUp className="h-3 w-3" />
                   {translateTrend(area.trend)}
                 </span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Métricas de Risco ao Vivo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <Users className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-xl font-bold text-[#1a3a52]">{area.populationAtRisk}</p>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">População</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <Home className="h-5 w-5 text-orange-500 mb-2" />
                    <p className="text-xl font-bold text-[#1a3a52]">{area.housesAtRisk}</p>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Estruturas</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Assinatura de Risco (Composição)</h4>
                <div className="space-y-4">
                  {area.causes.map((cause, i) => (
                    <div key={i} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-tight text-[#1a3a52]">
                         <span>{cause.label}</span>
                         <span>{cause.intensity}%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${cause.intensity}%` }}
                            className={cn(
                              "h-full rounded-full",
                              cause.intensity > 80 ? "bg-red-500" : "bg-blue-500"
                            )}
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="rounded-2xl border border-gray-100 bg-emerald-50/50 p-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600 mb-1">Confiança dos Dados</p>
                    <p className="text-2xl font-black text-emerald-700">{area.confidence}%</p>
                 </div>
                 <div className="rounded-2xl border border-gray-100 bg-amber-50/50 p-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mb-1">Momentum (dv/dt)</p>
                    <p className="text-2xl font-black text-amber-700">{area.momentum.toFixed(1)}x</p>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-red-50 bg-red-50/50 p-5">
                <div className="flex items-center gap-2 text-red-600 mb-3">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="text-sm font-bold uppercase tracking-tight">Plano Tático</h4>
                </div>
                <ul className="space-y-3">
                  {area.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs font-bold text-red-800 flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px]">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Matriz de Impacto Urbano</h4>
                <div className="grid grid-cols-3 gap-3">
                   <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 border border-gray-100">
                      <School className="h-4 w-4 text-blue-500 mb-1" />
                      <span className="text-xs font-black text-[#1a3a52]">{area.urbanImpact.schools}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Escolas</span>
                   </div>
                   <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 border border-gray-100">
                      <Building2 className="h-4 w-4 text-emerald-500 mb-1" />
                      <span className="text-xs font-black text-[#1a3a52]">{area.urbanImpact.hospitals}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Hospitais</span>
                   </div>
                   <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-3 border border-gray-100">
                      <CarFront className="h-4 w-4 text-amber-500 mb-1" />
                      <span className="text-xs font-black text-[#1a3a52]">{area.urbanImpact.blockedVias.length}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">Vias</span>
                   </div>
                </div>
                {area.urbanImpact.blockedVias.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100 italic text-[10px] text-amber-700">
                    Bloqueadas: {area.urbanImpact.blockedVias.join(', ')}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#1a3a52] p-4 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Motor de Confiança
                  </p>
                  <p className="text-2xl font-bold">{area.trustScore}% <span className="text-xs font-normal">Confiança</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-60">Prioridade</p>
                  <p className="text-sm font-bold">TOP {area.operationalPriority > 90 ? '1' : area.operationalPriority > 50 ? '3' : '5'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-4 flex justify-end">
             <button 
              onClick={onClose}
              className="rounded-xl px-6 py-2.5 text-sm font-bold text-[#1a3a52] hover:bg-gray-100 transition-colors"
             >
               Fechar Análise
             </button>
             <button className="ml-3 rounded-xl bg-[#1a3a52] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
               Acionar Equipe de Emergência
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
