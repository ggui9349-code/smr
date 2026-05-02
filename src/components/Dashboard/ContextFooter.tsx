import { useState, useEffect, type ReactNode } from 'react';
import { type MonitoringArea, RiskLevel } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, TrendingUp, ClipboardList, Building2, Users, Radio, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface ContextFooterProps {
  area: MonitoringArea;
  isLiveConnected: boolean;
  onAddStation: (areaId: string) => void;
}

type FooterTab = 'Clima' | 'Previsão' | 'Ações' | 'Infraestrutura' | 'Comunidade' | 'Radar';

export function ContextFooter({ area, isLiveConnected, onAddStation }: ContextFooterProps) {
  const [activeTab, setActiveTab] = useState<FooterTab>('Previsão');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTabPinned, setIsTabPinned] = useState(false);

  // Smart Context Switching
  useEffect(() => {
    if (isTabPinned) return;

    if (area.riskLevel === RiskLevel.EXTREME || area.riskLevel === RiskLevel.CRITICAL) {
      setActiveTab('Previsão');
    } else if (area.rainIntensity > 30) {
      setActiveTab('Clima');
    }
  }, [area.id, area.riskLevel, area.rainIntensity, isTabPinned]);

  const tabs: { id: FooterTab, icon: any }[] = [
    { id: 'Clima', icon: <CloudRain className="h-4 w-4" /> },
    { id: 'Previsão', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'Ações', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'Infraestrutura', icon: <Building2 className="h-4 w-4" /> },
    { id: 'Comunidade', icon: <Users className="h-4 w-4" /> },
    { id: 'Radar', icon: <Radio className="h-4 w-4" /> },
  ];

  return (
    <motion.footer 
      initial={false}
      animate={{ height: isMinimized ? 40 : 220 }}
      className="relative z-50 border-t border-white/10 bg-[#1A2847] text-white shadow-[0_-10px_25px_rgba(0,0,0,0.3)] transition-all duration-500"
    >
      {/* Tab Controls */}
      <div className="flex h-10 w-full items-center justify-between px-6 border-b border-white/5">
        <div className="flex h-full">
          {tabs.map(tab => (
            <button
               key={tab.id}
               onClick={() => {
                 setActiveTab(tab.id);
                 setIsTabPinned(true);
                 setIsMinimized(false);
               }}
               className={cn(
                 "relative flex h-full items-center gap-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === tab.id && !isMinimized ? "text-blue-400 bg-white/5" : "text-gray-500 hover:text-white"
               )}
            >
               {tab.icon}
               <span className="hidden md:inline">{tab.id}</span>
               {activeTab === tab.id && !isMinimized && (
                 <motion.div layoutId="footer-tab-active" className="absolute bottom-0 left-0 h-0.5 w-full bg-blue-500" />
               )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsTabPinned((value) => !value)}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest transition-colors",
              isTabPinned ? "text-blue-400" : "text-gray-500 hover:text-white"
            )}
          >
            {isTabPinned ? 'Fixado' : 'Auto'}
          </button>
          <button
             onClick={() => setIsMinimized(!isMinimized)}
             className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white"
          >
             {isMinimized ? 'Expandir ▲' : 'Minimizar ▼'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!isMinimized && (
        <div className="h-[180px] w-full p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
               {activeTab === 'Clima' && <ClimaContent />}
               {activeTab === 'Previsão' && <PrevisaoContent area={area} isLiveConnected={isLiveConnected} />}
               {activeTab === 'Ações' && <AcoesContent area={area} />}
               {activeTab === 'Infraestrutura' && <InfraContent area={area} onAddStation={onAddStation} />}
               {activeTab === 'Comunidade' && <ComunidadeContent />}
               {activeTab === 'Radar' && <RadarContent area={area} isLiveConnected={isLiveConnected} />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.footer>
  );
}

function ClimaContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
       <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-4 flex items-center gap-2">
             <CloudRain className="h-4 w-4" /> 🌦️ CLIMA ATUAL
          </h4>
          <div className="space-y-3">
             <WeatherMetric label="Chuva" value="45 mm/h" sub="Acum: 120mm" isCritical />
             <WeatherMetric label="Maré" value="1.20m" sub="ALTA (+25%)" isCritical />
          </div>
       </div>
       <div className="md:col-span-2 rounded-2xl bg-black/20 p-4 border border-white/5 flex flex-col justify-center">
          <p className="text-sm font-black text-white italic mb-2">"Análise: Chuva Intensa + Maré Alta detectada."</p>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
             <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Máxima amplificação de risco observada</p>
          </div>
       </div>
       <div className="space-y-3">
          <WeatherMetric label="Vento" value="18 km/h" sub="NE (Rajada: 28)" />
          <WeatherMetric label="Umidade" value="87%" sub="Ponto de orvalho 22°" />
       </div>
    </div>
  );
}

function PrevisaoContent({ area, isLiveConnected }: { area: MonitoringArea; isLiveConnected: boolean }) {
  const data = [
    { time: 'T+0', level: area.rainIntensity },
    { time: 'T+1h', level: area.rainIntensity + 5 },
    { time: 'T+2h', level: area.rainIntensity + 12 },
    { time: 'T+4h', level: area.rainIntensity + 8 },
    { time: 'T+6h', level: area.rainIntensity + 15 },
    { time: 'T+12h', level: area.rainIntensity - 10 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300">Tendência de Nível</h4>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                isLiveConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/20 text-amber-200"
              )}
            >
              {isLiveConnected ? 'AO VIVO' : 'SEM SINAL AO VIVO'}
            </span>
          </div>
          <div className="flex items-end justify-between border-b border-white/5 pb-2 mb-4">
             <p className="text-2xl font-black">{area.rainIntensity.toFixed(2)}m <span className="text-[10px] text-gray-500 ml-1">→ +2h: {(area.rainIntensity + 0.2).toFixed(2)}m</span></p>
             <div className="text-right">
                <p className="text-[8px] font-black text-emerald-400 uppercase">Pico esperado</p>
                <p className="text-xs font-black">EM +6H</p>
             </div>
          </div>
          <div className="space-y-2">
             <p className="text-[10px] font-bold text-gray-400 uppercase">Cenários Alternativos:</p>
             <div className="flex items-center gap-2 text-[10px] font-black text-red-400">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Se chover +50mm: Risco Extremo (95%)
             </div>
          </div>
       </div>
       <div className="md:col-span-2 h-full">
          <ResponsiveContainer width="100%" height="100%">
             <LineChart data={data}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Line type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
             </LineChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
}

function AcoesContent({ area }: { area: MonitoringArea }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
       <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Ações Executadas</h4>
          <div className="space-y-2">
             <ExecutedAction label="Evacuação iniciada" time="20:02" />
             <ExecutedAction label="Sirenes ativadas" time="20:00" />
             <ExecutedAction label="Bloqueio de via" time="19:58" />
          </div>
       </div>
       <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Ações Pendentes</h4>
          <div className="space-y-2">
             <PendingAction label="Notificação Defesa Civil" status="em progresso" />
             <PendingAction label="Contato com Escolas" status="aguardando" />
          </div>
       </div>
    </div>
  );
}

function InfraContent({ area, onAddStation }: { area: MonitoringArea; onAddStation: (areaId: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
       {area.stations.map(st => (
         <div key={st.id} className="p-4 rounded-2xl bg-black/20 border border-white/5">
            <div className="flex justify-between items-start mb-2">
               <h5 className="text-[10px] font-black uppercase tracking-tighter truncate w-32">{st.name}</h5>
               <div className={cn("h-1.5 w-1.5 rounded-full", st.status === 'online' ? 'bg-emerald-500' : 'bg-red-500')} />
            </div>
            <p className="text-xl font-black">{((st.currentUsage/st.capacity)*100).toFixed(0)}%</p>
            <div className="h-1 w-full bg-white/5 mt-2 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500" style={{ width: `${(st.currentUsage/st.capacity)*100}%` }} />
            </div>
         </div>
       ))}
       <button
         type="button"
         onClick={() => onAddStation(area.id)}
         className="flex flex-col justify-center items-center rounded-2xl border-2 border-dashed border-white/10 opacity-40 hover:opacity-100 cursor-pointer transition-all"
       >
          <Activity className="h-4 w-4 mb-1" />
          <span className="text-[8px] font-black uppercase">Adicionar Estação</span>
       </button>
    </div>
  );
}

function ComunidadeContent() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-2 custom-scrollbar">
       {[...Array(5)].map((_, i) => (
         <div key={i} className="min-w-[240px] p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex justify-between items-center mb-3">
               <span className="bg-emerald-500/20 text-emerald-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Validado</span>
               <span className="text-[8px] font-bold text-gray-500">há {i * 2 + 3} min</span>
            </div>
            <p className="text-xs font-bold text-gray-300 italic">"Água subindo rápido na Rua Beberibe..."</p>
            <div className="mt-3 flex items-center gap-2">
               <div className="h-5 w-5 rounded-full bg-gray-600" />
               <span className="text-[9px] font-black text-gray-400">Usuário Nível {5-i}</span>
            </div>
         </div>
       ))}
    </div>
  );
}

function RadarContent({ area, isLiveConnected }: { area: MonitoringArea; isLiveConnected: boolean }) {
  const step = Math.max(4, Math.round(area.rainIntensity * 0.15));
  const trendMultiplier = area.trend === 'rising' ? 1 : area.trend === 'falling' ? -1 : 0;

  const now = area.rainIntensity;
  const plus1h = Math.max(0, now + step * trendMultiplier);
  const plus2h = Math.max(0, plus1h + step * trendMultiplier);

  return (
    <div className="flex h-full items-center justify-between gap-6">
       <div className="relative h-full w-1/2 rounded-xl bg-black shadow-inner border border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.28),rgba(15,23,42,0.92)_55%,rgba(0,0,0,0.98)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-28 w-28">
              <div className="absolute inset-0 rounded-full border border-blue-400/20" />
              <div className="absolute inset-3 rounded-full border border-blue-400/25" />
              <div className="absolute inset-6 rounded-full border border-blue-400/30" />
              <div
                className="absolute left-1/2 top-1/2 h-[2px] w-14 -translate-x-1/2 -translate-y-1/2 origin-left bg-blue-400/70"
                style={{ transform: `translate(-50%, -50%) rotate(${40 + area.momentum * 220}deg)` }}
              />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/15">
             <Radio className="mb-2 h-6 w-6 text-blue-500 animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{area.municipality} • {area.name}</span>
          </div>
       </div>
       <div className="w-1/3 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300 font-sans">Análise Radar (2h)</h4>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                isLiveConnected ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/20 text-amber-200"
              )}
            >
              {isLiveConnected ? 'AO VIVO' : 'SEM SINAL AO VIVO'}
            </span>
          </div>
          <div className="space-y-1">
             <p className="text-xs font-bold transition-all hover:text-blue-400 cursor-default">{now.toFixed(1)} mm/h → {plus1h.toFixed(1)} mm/h (+1h)</p>
             <p className="text-xs font-bold text-gray-500">→ {plus2h.toFixed(1)} mm/h (+2h)</p>
          </div>
          <div className="space-y-1 border-t border-white/5 pt-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tendência: {translateTrendPt(area.trend)}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Confiança: {area.confidence.toFixed(1)}%</p>
          </div>
          <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest">FONTE: SINAIS OPERACIONAIS SIMA</p>
       </div>
    </div>
  );
}

function WeatherMetric({ label, value, sub, isCritical }: { label: string, value: string, sub: string, isCritical?: boolean }) {
  return (
    <div className="flex items-center justify-between">
       <div>
          <p className="text-[8px] font-bold text-gray-500 uppercase">{label}</p>
          <p className={cn("text-xs font-black", isCritical ? "text-red-400" : "text-white")}>{value}</p>
       </div>
       <span className="text-[9px] font-mono text-gray-500">{sub}</span>
    </div>
  );
}

function ExecutedAction({ label, time }: { label: string, time: string }) {
  return (
    <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
       <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase truncate w-32">{label}</span>
       </div>
       <span className="text-[10px] font-mono text-emerald-500/60">{time}</span>
    </div>
  );
}

function PendingAction({ label, status }: { label: string, status: string }) {
  return (
     <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
        <div className="flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
           <span className="text-[10px] font-bold text-amber-500 uppercase truncate w-32">{label}</span>
        </div>
        <span className="text-[8px] font-black text-amber-500/60 uppercase">{status}</span>
     </div>
  );
}

function translateTrendPt(trend: 'rising' | 'stable' | 'falling') {
  if (trend === 'rising') return 'SUBINDO';
  if (trend === 'stable') return 'ESTÁVEL';
  return 'CAINDO';
}
