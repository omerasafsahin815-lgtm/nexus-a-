
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface GroundingResult {
  title: string;
  uri: string;
  source?: string;
}

const GoogleHubView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const [response, setResponse] = useState<string | null>(null);
  const [links, setLinks] = useState<GroundingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setResponse(null);
    setLinks([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let config: any = {
        tools: mode === 'search' ? [{ googleSearch: {} }] : [{ googleMaps: {} }]
      };

      if (mode === 'maps') {
        // Geolocation info
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              }
            }
          };
        } catch (e) {
          console.warn("Konum alınamadı, varsayılan konum kullanılabilir.");
        }
      }

      const result = await ai.models.generateContent({
        model: mode === 'maps' ? 'gemini-2.5-flash' : 'gemini-3-flash-preview',
        contents: query,
        config
      });

      setResponse(result.text);

      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedLinks: GroundingResult[] = chunks.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri, source: 'Search' };
        if (chunk.maps) return { title: chunk.maps.title || 'Harita Konumu', uri: chunk.maps.uri, source: 'Maps' };
        return null;
      }).filter(Boolean);

      setLinks(extractedLinks);
    } catch (err) {
      console.error(err);
      setResponse("Bir hata oluştu. Lütfen sorgunuzu kontrol edin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-12 text-center">
        <div className="flex justify-center gap-2 mb-4">
          <span className="w-3 h-3 rounded-full bg-[#4285F4]"></span>
          <span className="w-3 h-3 rounded-full bg-[#EA4335]"></span>
          <span className="w-3 h-3 rounded-full bg-[#FBBC05]"></span>
          <span className="w-3 h-3 rounded-full bg-[#34A853]"></span>
        </div>
        <h2 className="text-4xl font-black mb-2 tracking-tight">Google Intelligence Hub</h2>
        <p className="text-gray-400">Gerçek zamanlı arama ve harita verileriyle güçlendirilmiş Gemini deneyimi.</p>
      </div>

      <div className="glass-panel p-8 rounded-[2rem] border-white/10 shadow-2xl mb-10">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setMode('search')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${mode === 'search' ? 'bg-[#4285F4] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
            Mega Arama
          </button>
          <button 
            onClick={() => setMode('maps')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${mode === 'maps' ? 'bg-[#34A853] text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}
          >
            <i className="fa-solid fa-location-dot"></i>
            Mega Haritalar
          </button>
        </div>

        <div className="relative group">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'search' ? "Bugün dünyada neler oldu? En güncel haberleri sor..." : "Yakınlardaki en iyi İtalyan restoranlarını bul..."}
            className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 pr-16 focus:outline-none focus:border-indigo-500 transition-all text-lg resize-none min-h-[140px]"
          />
          <button 
            onClick={handleAction}
            disabled={!query.trim() || isLoading}
            className={`absolute right-4 bottom-4 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 ${mode === 'search' ? 'bg-[#4285F4]' : 'bg-[#34A853]'}`}
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
          </button>
        </div>
      </div>

      {response && (
        <div className="animate-fade-in space-y-8">
          <div className="glass-panel p-8 rounded-[2rem] border-white/10 leading-relaxed text-lg italic text-white/90 font-medium">
            {response}
          </div>

          {links.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-link text-indigo-400"></i>
                Doğrulama Kaynakları ve Konumlar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {links.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="glass-panel p-5 rounded-2xl border-white/5 hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${link.source === 'Maps' ? 'bg-[#34A853]/20 text-[#34A853]' : 'bg-[#4285F4]/20 text-[#4285F4]'}`}>
                        <i className={`fa-solid ${link.source === 'Maps' ? 'fa-map-pin' : 'fa-globe'}`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{link.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-black">{link.source}</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-gray-700 group-hover:text-white transition-colors"></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading && !response && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 ${mode === 'search' ? 'bg-[#4285F4]/20 text-[#4285F4]' : 'bg-[#34A853]/20 text-[#34A853]'}`}>
              <i className="fa-solid fa-satellite-dish animate-bounce"></i>
           </div>
           <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">
              Google {mode === 'search' ? 'Veri Tabanı' : 'Harita Protokolü'} Sorgulanıyor...
           </p>
        </div>
      )}
    </div>
  );
};

export default GoogleHubView;
