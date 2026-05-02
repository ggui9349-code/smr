import { motion } from 'motion/react';
import { CloudRain } from 'lucide-react';

export function RainRadar() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-2xl">
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-400">Rain Radar</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Recife / Metro Area</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <CloudRain className="h-4 w-4" />
          </div>
        </div>

        <div className="relative flex aspect-square w-full items-center justify-center rounded-full border border-slate-800 bg-slate-950/50">
          {/* Radar Sweeper */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute h-full w-full rounded-full border-r-2 border-blue-500/20"
            style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.2) 360deg)' }}
          />
          
          {/* Radar Grids */}
          {[1, 2, 3].map(i => (
             <div key={i} className="absolute rounded-full border border-slate-800" style={{ width: `${i * 33}%`, height: `${i * 33}%` }}></div>
          ))}

          {/* Simulated Rain Blobs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute top-1/4 left-1/3 h-12 w-16 rounded-full bg-blue-500 blur-xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ repeat: Infinity, duration: 4, delay: 1 }}
            className="absolute bottom-1/3 right-1/4 h-8 w-12 rounded-full bg-red-500 blur-xl font-black"
          />

          <div className="z-20 h-1.5 w-1.5 rounded-full bg-white shadow-lg shadow-white/50"></div>
        </div>

        <div className="mt-4 flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
          <span>60km</span>
          <span className="text-blue-400">120km Scan</span>
          <span>180km</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] pointer-events-none" />
    </div>
  );
}
