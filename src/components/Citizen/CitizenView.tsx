import { useState, FormEvent, ReactNode, useMemo, useEffect } from 'react';
import { Search, MapPin, AlertCircle, Phone, Navigation, Share2, Printer, MessageSquare, Bell, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { RiskLevel, type MonitoringArea } from '../../types';
import { findAreaByCitizenContext } from '../../domain/citizenSearch';
import { isCepQuery, lookupCep, extractCepDigits, type CepAddress } from '../../domain/cepLookup';
import { enrichCitizenQueryWithAi } from '../../domain/citizenAiAssist';

interface CitizenViewProps {
  areas: MonitoringArea[];
}

export function CitizenView({ areas }: CitizenViewProps) {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<MonitoringArea | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cepCache, setCepCache] = useState<Record<string, CepAddress>>({});
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(2);

  const areaSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 2) return [];

    return areas
      .flatMap((area) => [
        area.name,
        `${area.name}, ${area.municipality}`,
        area.municipality,
      ])
      .filter((value, index, list) => list.indexOf(value) === index)
      .filter((value) => value.toLowerCase().includes(q))
      .slice(0, 6);
  }, [areas, search]);

  useEffect(() => {
    const digits = extractCepDigits(search);
    const local = [...areaSuggestions];

    if (digits.length >= 5) {
      const cached = Object.values(cepCache)
        .filter((address) => extractCepDigits(address.cep).startsWith(digits))
        .map((address) => `${address.cep} — ${address.logradouro || address.bairro || address.localidade}/${address.uf}`)
        .slice(0, 4);

      setSuggestions([...local, ...cached].slice(0, 8));
      return;
    }

    setSuggestions(local.slice(0, 8));
  }, [search, areaSuggestions, cepCache]);

  const runCitizenSearch = async (query: string) => {
    setIsSearching(true);
    setNotFound(false);

    try {
      if (isCepQuery(query)) {
        const address = await lookupCep(query);
        if (address) {
          setCepCache((previous) => ({
            ...previous,
            [extractCepDigits(address.cep)]: address,
          }));

          const cepQuery = `${address.logradouro} ${address.bairro} ${address.localidade}`.trim();
          const byCep =
            findAreaByCitizenContext(areas, { query: cepQuery }) ??
            findAreaByCitizenContext(areas, { query: address.localidade });
          setResult(byCep);
          setNotFound(!byCep);
          return;
        }
      }

      const directMatch = findAreaByCitizenContext(areas, { query });
      if (directMatch) {
        setResult(directMatch);
        setNotFound(false);
        return;
      }

      const enrichedQuery = await enrichCitizenQueryWithAi(query);
      const aiMatch = enrichedQuery
        ? findAreaByCitizenContext(areas, { query: enrichedQuery })
        : null;

      setResult(aiMatch);
      setNotFound(!aiMatch);
    } catch {
      const fallback = findAreaByCitizenContext(areas, { query });
      setResult(fallback);
      setNotFound(!fallback);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    await runCitizenSearch(search);
  };

  const applySuggestion = async (value: string) => {
    const normalized = value.split(' — ')[0].trim();
    setSearch(normalized);
    setShowSuggestions(false);
    await runCitizenSearch(normalized);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          );

          if (!response.ok) return;

          const payload = (await response.json()) as {
            address?: {
              road?: string;
              city?: string;
              town?: string;
              municipality?: string;
              state_district?: string;
            };
          };

          const road = payload.address?.road ?? '';
          const city =
            payload.address?.city ??
            payload.address?.town ??
            payload.address?.municipality ??
            payload.address?.state_district ??
            '';

          const query = `${road} ${city}`.trim();
          const geoResult = findAreaByCitizenContext(areas, {
            query,
            coordinates: [coords.latitude, coords.longitude],
          });

          if (query) {
            setSearch(query);
          }

          if (geoResult) {
            setResult(geoResult);
            setNotFound(false);
            return;
          }

          if (query) {
            await runCitizenSearch(query);
          } else {
            setResult(null);
            setNotFound(true);
          }
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleEnableSmsAlerts = () => {
    setSmsAlertsEnabled((previous) => previous + 1);
  };

  const handleOpenMap = () => {
    if (!result) return;
    const [lat, lon] = result.coordinates;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!result) return;

    const shareText = `Alerta de risco em ${result.name}, ${result.municipality}: ${toPortugueseRiskLabel(result.riskLevel)} (${result.classification}).`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SIMA-RMR - Risco de Alagamento',
          text: shareText,
        });
        return;
      } catch {
        return;
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-80px)] bg-gray-50 p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Search Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-2xl mb-6">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-black text-[#1a3a52] tracking-tighter">Minha rua alaga?</h2>
          <p className="text-gray-500 font-medium mt-2">Consulte o risco para sua localização em tempo real.</p>
        </motion.div>

        {/* Search Box */}
        <div className="rounded-[40px] bg-white p-8 shadow-2xl shadow-blue-900/5">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Ex: Av. Beberibe, Rua do Futuro..."
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-6 py-4 text-base font-bold text-[#1a3a52] outline-none transition-all focus:border-blue-500 focus:bg-white"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left text-sm font-semibold text-[#1a3a52] hover:bg-blue-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              type="submit"
              className="rounded-2xl bg-blue-600 px-8 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-900/20"
            >
              BUSCAR
            </button>
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-blue-50 bg-blue-50/30 px-6 py-4 text-sm font-black text-blue-600 transition-all hover:bg-blue-50 disabled:opacity-60"
            >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
              {isLocating ? 'Localizando...' : 'Usar GPS'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-4 justify-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exemplos:</span>
             {['Av. Beberibe', 'Rua do Futuro', 'CEP 52051-340'].map(ex => (
               <button key={ex} onClick={() => setSearch(ex)} className="text-[10px] font-bold text-blue-600 hover:underline">{ex}</button>
             ))}
          </div>
        </div>

        {/* Result Area */}
        <AnimatePresence mode="wait">
          {isSearching ? (
             <motion.div 
               key="searching"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center py-12"
             >
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-sm font-black text-blue-600 uppercase tracking-widest">Consultando Modelos...</p>
             </motion.div>
          ) : notFound ? (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white p-8 text-center shadow-xl"
            >
              <p className="text-sm font-black text-[#1a3a52] uppercase tracking-wider">Local não encontrado</p>
              <p className="mt-2 text-sm text-gray-500">Tente buscar por rua ou município (ex: Rua do Futuro, Paulista).</p>
            </motion.div>
          ) : result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[40px] border-l-[12px] border-red-600 bg-white p-10 shadow-2xl overflow-hidden"
              style={{ borderLeftColor: getRiskResultColor(result.riskLevel) }}
            >
               <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8">
                  <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">LOCALIZAÇÃO IDENTIFICADA</p>
                     <h3 className="text-2xl font-black text-[#1a3a52]">{result.name}, {result.municipality}</h3>
                  </div>
                  <div className={cn(
                    "rounded-2xl px-6 py-3 text-center shadow-lg",
                    getRiskResultBg(result.riskLevel)
                  )}>
                     <p className="text-[10px] font-black uppercase opacity-60">Status de Risco</p>
                     <p className="text-xl font-black">{toPortugueseRiskLabel(result.riskLevel)} ({result.classification})</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#1a3a52]">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        Em sua área:
                     </h4>
                     <ul className="space-y-4">
                        <ResultItem label="Nível esperado" value={`${(result.rainIntensity / 20).toFixed(2)}m`} />
                        <ResultItem label="Essa rua já alagou" value={result.classification === 'R4' ? 'SIM (Reflexo 2023)' : 'Raramente'} />
                        <ResultItem label="Tempo até piora" value={result.eta} />
                     </ul>

                     <div className="pt-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                           <Phone className="h-4 w-4" />
                           Contatos Úteis
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                           <ContactCard label="Defesa Civil" value="(81) 3433-0000" />
                           <ContactCard label="Bombeiros" value="193" />
                        </div>
                     </div>
                  </div>

                  <div className="rounded-3xl bg-gray-50 p-6">
                     <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 font-sans">O QUE FAZER AGORA</h4>
                     <div className="space-y-6">
                        <ActionStep title="IMEDIATO" desc="Verificar bueiros e drenagem interna." delay="Agora" />
                        <ActionStep title="EM 4 HORAS" desc="Prepare documentos e pertences essenciais." delay="Próximo" />
                        <ActionStep title="SE ORDENADO" desc="A evacuação será obrigatória. Siga rotas." isCritical />
                     </div>
                  </div>
               </div>

               <div className="mt-10 flex flex-wrap gap-4 pt-8 border-t border-gray-100">
                  <button
                    onClick={handleEnableSmsAlerts}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-lg active:scale-95"
                  >
                     <Bell className="h-4 w-4" /> ATIVAR ALERTAS SMS
                  </button>
                  <button
                    onClick={handleOpenMap}
                    className="flex items-center gap-2 rounded-xl border-2 border-gray-100 px-6 py-3 text-xs font-black text-[#1a3a52] hover:bg-gray-50"
                  >
                     <Navigation className="h-4 w-4" /> VER MAPA
                  </button>
                  <div className="flex-1" />
                  <button onClick={handleShare} className="p-3 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><Share2 className="h-5 w-5" /></button>
                  <button onClick={handlePrint} className="p-3 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><Printer className="h-5 w-5" /></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer SMS Status */}
      <div className="fixed bottom-0 left-0 w-full p-4 pointer-events-none">
         <div className="container mx-auto max-w-4xl flex justify-center">
            <div className="pointer-events-auto flex items-center gap-6 rounded-full bg-[#1A2847] px-8 py-3 text-white shadow-2xl border border-white/10">
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alertas SMS Ativados ({smsAlertsEnabled})</span>
               </div>
               <div className="h-4 w-[1px] bg-white/10" />
               <button className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300">Editar Alertas</button>
            </div>
         </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Fontes em uso</p>
          <p className="mt-1 text-xs font-bold text-blue-900">Dados ao vivo: API configurada | Enriquecimento de busca: IA Gemini | Classificação final: motor de risco SIMA-RMR</p>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value }: { label: string, value: string }) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="font-bold text-gray-400 uppercase text-[10px] tracking-tight">{label}</span>
      <span className="font-black text-[#1a3a52]">{value}</span>
    </li>
  );
}

function ContactCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-white border border-gray-100 p-2 rounded-xl">
       <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">{label}</p>
       <p className="text-[11px] font-bold text-blue-600">{value}</p>
    </div>
  );
}

function ActionStep({ title, desc, delay, isCritical }: { title: string, desc: string, delay?: string, isCritical?: boolean }) {
  return (
    <div className="flex gap-4">
       <div className={cn(
         "flex h-4 w-4 items-center justify-center rounded-full mt-1 border-2 shadow-sm",
         isCritical ? "border-red-500 bg-red-100" : "border-blue-500 bg-blue-100"
       )}>
          <div className={cn("h-1.5 w-1.5 rounded-full", isCritical ? "bg-red-500" : "bg-blue-500")} />
       </div>
       <div>
          <div className="flex items-center gap-2">
             <p className={cn("text-[10px] font-black tracking-widest", isCritical ? "text-red-600" : "text-[#1a3a52]")}>{title}</p>
             {delay && <span className="text-[8px] font-bold text-gray-400">{delay}</span>}
          </div>
          <p className="text-xs font-bold text-gray-500 mt-1">{desc}</p>
       </div>
    </div>
  );
}

function toPortugueseRiskLabel(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.SAFE: return 'SEGURO';
    case RiskLevel.ATTENTION: return 'ATENÇÃO';
    case RiskLevel.HIGH: return 'ALTO';
    case RiskLevel.CRITICAL: return 'CRÍTICO';
    case RiskLevel.EXTREME: return 'EXTREMO';
    default: return 'DESCONHECIDO';
  }
}

function getRiskResultColor(level: RiskLevel) {
  switch (level) {
    case RiskLevel.SAFE: return '#10b981';
    case RiskLevel.ATTENTION: return '#f59e0b';
    case RiskLevel.HIGH: return '#f97316';
    case RiskLevel.CRITICAL: return '#ef4444';
    case RiskLevel.EXTREME: return '#000000';
    default: return '#6b7280';
  }
}

function getRiskResultBg(level: RiskLevel) {
  switch (level) {
    case RiskLevel.SAFE: return 'bg-emerald-100 text-emerald-800';
    case RiskLevel.ATTENTION: return 'bg-amber-100 text-amber-800';
    case RiskLevel.HIGH: return 'bg-orange-100 text-orange-800';
    case RiskLevel.CRITICAL: return 'bg-red-100 text-red-800';
    case RiskLevel.EXTREME: return 'bg-black text-white';
    default: return 'bg-gray-100 text-gray-800';
  }
}
