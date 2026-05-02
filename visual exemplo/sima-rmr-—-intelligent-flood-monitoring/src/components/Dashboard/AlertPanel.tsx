import { RiskLevel, type Alert } from '../../types';
import { cn } from '../../lib/utils';
import { AlertTriangle, Clock, MessageSquare, Radio, Bell, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface AlertPanelProps {
  alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#1a3a52]">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Central de Alertas
        </h2>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
          {alerts.length} PULSES
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {alerts.map((alert, idx) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "group relative border-l-4 rounded-r-2xl bg-white p-5 shadow-sm hover:shadow-xl transition-all duration-300",
              alert.level === RiskLevel.EXTREME ? "border-black bg-gray-50/50" : 
              alert.level === RiskLevel.CRITICAL ? "border-red-500" : "border-orange-500"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={cn(
                  "inline-block rounded px-1.5 py-0.5 text-[8px] font-black uppercase mb-1",
                  alert.level === RiskLevel.EXTREME ? "bg-black text-white" : "bg-red-100 text-red-600"
                )}>
                  {alert.level} PRE-ESCALATION
                </span>
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {alert.areaName}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase">
                <Clock className="h-3 w-3" />
                {alert.eta}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-gray-600 font-medium line-clamp-2 mb-4">{alert.description}</p>
            
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
               {/* Notification Channels */}
               <div className="flex gap-2">
                  {alert.channels?.map(channel => (
                    <div key={channel} className="text-gray-400 hover:text-blue-500 transition-colors cursor-help group/icon">
                       {channel === 'sms' && <MessageSquare className="h-3.5 w-3.5" />}
                       {channel === 'radio' && <Radio className="h-3.5 w-3.5" />}
                       {channel === 'push' && <Bell className="h-3.5 w-3.5" />}
                    </div>
                  ))}
               </div>

               {/* OPS Action */}
               <div className={cn(
                 "rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                 alert.actionType === 'evacuate' ? "bg-red-600 text-white shadow-lg shadow-red-900/20" : 
                 alert.actionType === 'dispatch' ? "bg-[#1a3a52] text-white" : "bg-gray-100 text-gray-500"
               )}>
                 {alert.actionType} RECOMMENDED
               </div>
            </div>

            {alert.level === RiskLevel.EXTREME && (
              <motion.div 
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-r-2xl border-2 border-red-500 pointer-events-none"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
