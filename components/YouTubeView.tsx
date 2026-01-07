
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface VideoResult {
  title: string;
  uri: string;
}

const YouTubeView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'creator'>('search');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setAnalysis(null);
    setVideos([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = mode === 'search' 
        ? `YouTube'da "${query}" ile ilgili en iyi ve en güncel videoları bul, içeriklerini açıkla ve linklerini ver.`
        : `Bir YouTube içerik üreticisi için "${query}" konusu hakkında: 1. Viral olabilecek 5 başlık önerisi, 2. SEO anahtar kelimeleri, 3. Video giriş senaryosu taslağı oluştur.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setAnalysis(response.text);

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedVideos = chunks
        .map((c: any) => (c.web ? { title: c.web.title, uri: c.web.uri } : null))
        .filter((v: any) => v && v.uri.includes('youtube.com'));

      setVideos(extractedVideos);
    } catch (err) {
      console.error(err);
      setAnalysis("YouTube verilerine şu an ulaşılamıyor. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-red-600/20">
            <i className="fa-brands fa-youtube"></i>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">YouTube Intelligence Hub</h2>
            <p className="text-gray-500 font-medium">Video Arama, Analiz ve İçerik Stüdyosu</p>
          </div>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setMode('search')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'search' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            Video Bul
          </button>
          <button 
            onClick={() => setMode('creator')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'creator' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}
          >
            İçerik Stüdyosu
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl mb-12">
        <div className="relative group">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSearch())}
            placeholder={mode === 'search' ? "Hangi konuda video arıyorsun? (Örn: En iyi React dersleri 2024)" : "Hangi konuda içerik üretmek istiyorsun? (Örn: Yapay zeka haberleri)"}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-red-500 transition-all text-lg min-h-[120px] resize-none"
          />
          <button 
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="absolute right-4 bottom-4 w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse text-center">
          <div className="w-16 h-16 bg-red-600/20 text-red-600 rounded-full flex items-center justify-center text-2xl mb-4">
            <i className="fa-solid fa-satellite-dish animate-bounce"></i>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">YouTube Verileri İşleniyor...</p>
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-[2rem] border-white/10 text-white/90 leading-relaxed prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <i className="fa-solid fa-file-lines text-red-500"></i>
                Nexus Analiz Raporu
              </h3>
              <div className="whitespace-pre-wrap italic">
                {analysis}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">Referans Videolar</h3>
            {videos.length > 0 ? (
              <div className="space-y-4">
                {videos.map((v, i) => (
                  <a 
                    key={i} 
                    href={v.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col glass-panel p-4 rounded-2xl border-white/5 hover:border-red-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-600">
                        <i className="fa-brands fa-youtube"></i>
                      </div>
                      <p className="font-bold text-sm line-clamp-2 text-white/80 group-hover:text-red-400 transition-colors">{v.title}</p>
                    </div>
                    <div className="mt-auto flex justify-end">
                      <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-white">İzle <i className="fa-solid fa-arrow-right ml-1"></i></span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-6 rounded-2xl border-dashed border-white/10 text-center opacity-40">
                <p className="text-xs italic">Direkt link bulunamadı.</p>
              </div>
            )}
            
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-red-600/5">
              <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">Kısa İpucu</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed italic">
                YouTube'da öne çıkmak için ilk 30 saniyede izleyiciyi yakalamalı ve thumbnail (küçük resim) tasarımında kontrast renkler kullanmalısın.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeView;
