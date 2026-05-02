import { motion } from 'motion/react';
import { Clock, Sliders, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ScenarioScrubberProps {
  offset: number;
  onChange: (val: number) => void;
  decisionMode: 'technical' | 'citizen';
  onToggleMode: () => void;
}

export function ScenarioScrubber({ offset, onChange, decisionMode, onToggleMode }: ScenarioScrubberProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#1a3a52]">Controle Temporal</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Projeção de Impacto de Risco (ETA)</p>
          </div>
        </div>

        <button 
          onClick={onToggleMode}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
            decisionMode === 'technical' ? "bg-[#1a3a52] text-white shadow-lg" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          {decisionMode === 'technical' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          Modo {decisionMode === 'technical' ? 'técnico' : 'cidadão'}
        </button>
      </div>

      <div className="relative px-2">
        <div className="mb-8 flex justify-between text-[10px] font-black uppercase tracking-tighter text-gray-400">
          <span>-60 min</span>
          <span className="text-[#1a3a52]">Agora</span>
          <span>+60 min</span>
        </div>
        
        <input 
          type="range" 
          min="-60" 
          max="60" 
          value={offset}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-100 accent-[#1a3a52]"
        />
        
        <div className="mt-2 flex justify-center">
           <motion.div 
             key={offset}
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={cn(
               "rounded-md px-2 py-1 text-[10px] font-black uppercase",
               offset === 0 ? "bg-emerald-100 text-emerald-600" : (offset > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600")
             )}
           >
             {offset === 0 ? 'Ao Vivo' : (offset > 0 ? `Projeção: +${offset}m` : `Histórico: ${offset}m`)}
           </motion.div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
         <div className="col-span-2 space-y-3">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Presets de Simulação (Motor de Cenários)</p>
            <div className="flex gap-2">
               {[
                 { label: 'Tempestade Forte', icon: '⛈️' },
                 { label: 'Maré Alta', icon: '🌊' },
                 { label: 'Falha de Infraestrutura', icon: '⚡' }
               ].map(preset => (
                 <button 
                   key={preset.label}
                   className="flex-1 rounded-xl border border-gray-100 bg-white p-2 text-center text-[9px] font-black uppercase transition-all hover:border-blue-200 hover:shadow-md active:scale-95"
                 >
                   <span className="mb-1 block text-lg">{preset.icon}</span>
                   {preset.label}
                 </button>
               ))}
            </div>
         </div>

         <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">Sensibilidade (Viés de Confiança)</p>
            <div className="flex items-center gap-3">
               <Sliders className="h-4 w-4 text-gray-300" />
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 defaultValue="75"
                 className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500" 
               />
            </div>
         </div>
         <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">Conservadorismo do Algoritmo</p>
            <div className="flex items-center gap-3">
               <Sliders className="h-4 w-4 text-gray-300" />
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 defaultValue="50"
                 className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-amber-500" 
               />
            </div>
         </div>
      </div>
    </div>
  );
}
