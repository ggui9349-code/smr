import { Camera, Send, MapPin, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function ReportForm() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#1a3a52]">Relato da Comunidade</h2>
          <p className="text-xs font-medium text-gray-400">Cidadãos contribuindo para a avaliação de risco em tempo real.</p>
        </div>
        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
          <AlertCircle className="h-5 w-5" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Localização / Bairro</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Where are you?"
                className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-10 pr-4 text-sm font-medium transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Visual Evidence</label>
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-3 text-sm font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-[#1a3a52]">
              <Camera className="h-5 w-5" />
              Upload Image
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Event Description</label>
          <textarea 
            rows={3}
            placeholder="Describe the situation (e.g. visible cracks in slope, water accumulation...)"
            className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm font-medium transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
          ></textarea>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3a52] py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition-all hover:bg-[#122b3e] hover:shadow-xl"
        >
          <Send className="h-4 w-4" />
          SUBMIT CRITICAL REPORT
        </motion.button>
      </form>
    </div>
  );
}
