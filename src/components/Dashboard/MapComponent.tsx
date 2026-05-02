import { MapContainer, TileLayer, CircleMarker, useMap, Tooltip } from 'react-leaflet';
import { RiskLevel, type MonitoringArea } from '../../types';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

function MapController({
  center,
  focused,
  focusNonce,
}: {
  center: [number, number];
  focused: boolean;
  focusNonce: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focused) return;

    const zoomLevel = focusNonce > 0 ? 17 : 15;
    map.stop();
    map.flyTo(center, zoomLevel, { duration: 1.2 });
  }, [center, map, focused, focusNonce]);
  return null;
}

interface MapComponentProps {
  areas: MonitoringArea[];
  onAreaSelect: (area: MonitoringArea) => void;
  focusedArea?: MonitoringArea | null;
  focusNonce?: number;
}

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case RiskLevel.SAFE: return '#10b981';
    case RiskLevel.ATTENTION: return '#f59e0b';
    case RiskLevel.HIGH: return '#f97316';
    case RiskLevel.CRITICAL: return '#ef4444';
    case RiskLevel.EXTREME: return '#ef4444';
    default: return '#6b7280';
  }
};

const getInfraColor = (assignedTeams: number) => {
  if (assignedTeams >= 4) return '#22c55e';
  if (assignedTeams >= 2) return '#eab308';
  return '#ef4444';
};

const getTideColor = (trend: MonitoringArea['trend']) => {
  if (trend === 'rising') return '#ef4444';
  if (trend === 'stable') return '#0ea5e9';
  return '#22c55e';
};

export function MapComponent({ areas, onAreaSelect, focusedArea, focusNonce = 0 }: MapComponentProps) {
  const defaultCenter: [number, number] = [-8.054, -34.881];
  const center = focusedArea ? focusedArea.coordinates : defaultCenter;
  const [activeLayer, setActiveLayer] = useState<'Risco' | 'Infra' | 'Maré'>('Risco');

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0F172A]">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController center={center} focused={!!focusedArea} focusNonce={focusNonce} />
        
        {areas.map((area) => {
          const isExtreme = area.riskLevel === RiskLevel.EXTREME;
          const isSelected = focusedArea?.id === area.id;

          const color =
            activeLayer === 'Risco'
              ? getRiskColor(area.riskLevel)
              : activeLayer === 'Infra'
                ? getInfraColor(area.assignedTeams)
                : getTideColor(area.trend);

          const markerRadius =
            activeLayer === 'Risco'
              ? isSelected ? 14 : isExtreme ? 12 : 8
              : activeLayer === 'Infra'
                ? isSelected ? 15 : 10 + Math.min(6, area.assignedTeams)
                : isSelected ? 15 : area.trend === 'rising' ? 13 : area.trend === 'stable' ? 10 : 8;

          const haloRadius =
            activeLayer === 'Risco'
              ? 20 + (100 - area.confidence) / 2
              : activeLayer === 'Infra'
                ? 18 + area.assignedTeams * 2
                : area.trend === 'rising' ? 24 : area.trend === 'stable' ? 20 : 16;

          const layerLabel =
            activeLayer === 'Risco'
              ? area.riskLevel
              : activeLayer === 'Infra'
                ? `${area.assignedTeams} equipes`
                : area.trend === 'rising'
                  ? 'MARÉ SUBINDO'
                  : area.trend === 'stable'
                    ? 'MARÉ ESTÁVEL'
                    : 'MARÉ BAIXANDO';

          return (
            <div key={area.id}>
              <CircleMarker
                center={area.coordinates}
                radius={haloRadius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.05,
                  color: color,
                  weight: 1,
                  dashArray: '5, 5',
                  opacity: 0.2
                }}
              />

              {isSelected && (
                <CircleMarker
                  center={area.coordinates}
                  radius={haloRadius + 5}
                  pathOptions={{
                    fillColor: 'transparent',
                    color: '#3b82f6',
                    weight: 2,
                    opacity: 0.5
                  }}
                  className="animate-pulse"
                />
              )}

              <CircleMarker
                center={area.coordinates}
                radius={markerRadius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 1,
                  color: '#ffffff',
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onAreaSelect(area),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={isExtreme || isSelected}>
                   <div className="flex flex-col items-center bg-black/80 p-2 rounded-lg border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">{area.name}</p>
                      <p className={cn(
                        "text-[8px] font-bold uppercase mt-0.5",
                        area.riskLevel === RiskLevel.EXTREME ? "text-red-400" : "text-gray-400"
                      )}>{layerLabel}</p>
                   </div>
                </Tooltip>
              </CircleMarker>
            </div>
          );
        })}
      </MapContainer>
      
      {/* SCAN LINE ANIMATION */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute left-0 z-[600] h-[1px] w-full bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
      />

      {/* Modern Search/Filter Layer (Compact) */}
      <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
        <div className="flex w-64 items-center gap-3 rounded-2xl bg-[#1A2847]/90 p-3 shadow-2xl backdrop-blur-md border border-white/10 text-white">
           <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           </div>
           <div className="flex-1">
              <p className="text-[8px] font-black text-blue-300 uppercase tracking-[0.2em] mb-0.5 opacity-60">Motor Visual</p>
              <span className="text-[10px] font-black uppercase tracking-widest">Operações Recife</span>
           </div>
        </div>

        <div className="flex gap-2">
           {(['Risco', 'Infra', 'Maré'] as const).map((layer) => (
             <button
               key={layer}
               onClick={() => setActiveLayer(layer)}
               className={cn(
                 "rounded-xl border px-4 py-2 text-[8px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md transition-all",
                 activeLayer === layer
                   ? "border-blue-400/50 bg-blue-500/20 text-blue-200"
                   : "border-white/10 bg-[#1A2847]/80 text-white hover:bg-white/10"
               )}
             >
               {layer}
             </button>
           ))}
        </div>
      </div>

      {/* Legend (Compact) */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 rounded-2xl bg-[#1A2847]/90 p-4 shadow-2xl backdrop-blur-xl border border-white/10 text-white text-[9px] font-black tracking-widest">
        <div className="flex items-center gap-3 opacity-80"><div className="h-2 w-2 rounded-full bg-red-600" /> EXTREMO</div>
        <div className="flex items-center gap-3 opacity-80"><div className="h-2 w-2 rounded-full bg-orange-500" /> CRÍTICO</div>
        <div className="flex items-center gap-3 opacity-80"><div className="h-2 w-2 rounded-full bg-emerald-500" /> NORMAL</div>
      </div>
    </div>
  );
}
