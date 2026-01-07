
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const TVView: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState('atv');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const channels = [
    { id: 'atv', name: 'aTV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Atv_logo_2011.svg/1200px-Atv_logo_2011.svg.png', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCp9vX8v2f-1A-o85h4v6VfQ' },
    { id: 'hurriyet', name: 'Hürriyet', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/H%C3%BCrriyet_logo.svg/1200px-H%C3%BCrriyet_logo.svg.png', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCCp69_x_D9D7-Q_P6fO-Iug' },
    { id: 'kanald', name: 'Kanal D', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Kanal_D_logo_2011.svg/1200px-Kanal_D_logo_2011.svg.png', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCBODS-3w46o98vX-n_O8v7A' },
    { id: 'trt1', name: 'TRT 1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/TRT_1_logo_2021.svg/1200px-TRT_1_logo_2021.svg.png', streamUrl: 'https://www.youtube.com/embed/live_stream?channel=UCP5pWfI-36v8J6zG-8L8vJQ' },
  ];

  const handleAiAnalyze = async () => {
    setIsAiAnalyzing(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Şu an ${channels.find(c => c.id === currentChannel)?.name} kanalında ne yayınlandığını (varsayımsal veya Google Search kullanarak) analiz et ve kısa bir özet geç. Ayrıca bu kanalın genel kitlesi hakkında bilgi ver. Son dakika haberlerini de kontrol et.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      setAiAnalysis(response.text);
    } catch (err) {
      setAiAnalysis("Şu an canlı yayın verilerine ulaşılamıyor. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const selectedChannel = channels.find(c => c.id === currentChannel) || channels[0];

  return (
    <div className="h-full flex flex-col bg-[#050608] animate-fade-in overflow-hidden font-sans">
      {/* Cinematic Header */}
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 z-10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-red-900/40">
            <i className="fa-solid fa-satellite"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Nexus Haber Merkezi</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">7/24 Canlı Yayın Akışı</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 max-w-full overflow-x-auto scrollbar-hide">
          {channels.map(chan => (
            <button
              key={chan.id}
              onClick={() => setCurrentChannel(chan.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                currentChannel === chan.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <img src={chan.logo} alt={chan.name} className={`h-4 object-contain ${currentChannel === chan.id ? '' : 'invert opacity-60'}`} />
              {chan.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 overflow-hidden">
        {/* Player Section */}
        <div className="flex-[3] flex flex-col gap-6 overflow-y-auto scrollbar-hide">
          <div className="relative aspect-video glass-panel rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl bg-black group">
            <iframe
              className="w-full h-full"
              src={selectedChannel.streamUrl}
              title="Nexus TV Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
            
            <div className="absolute top-6 left-6 flex items-center gap-3">
               <span className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                  <i className="fa-solid fa-circle text-[8px]"></i> CANLI
               </span>
               <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white/70 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {selectedChannel.name} HD
               </span>
            </div>
            
            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="glass-panel px-4 py-2 rounded-xl text-[10px] font-bold bg-black/60">
                  SIGNAL: 10.4 GHz / ENCRYPTED
               </div>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 bg-gradient-to-br from-red-500/5 to-transparent">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-3">
                   <i className="fa-solid fa-tower-broadcast text-red-500"></i>
                   Yayın Akışı & Analiz
                </h3>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
                   <i className="fa-solid fa-eye animate-pulse"></i>
                   1.2M TOTAL REACH
                </div>
             </div>
             <p className="text-sm text-gray-400 leading-relaxed italic">
                Nexus Haber Merkezi, Gemini 3 altyapısı ile en güncel haber kanallarını ve {selectedChannel.name} yayınını anlık olarak izlemenizi sağlar. AI asistanınız ile yayın içeriğini özetleyebilir veya derin analizler yapabilirsiniz.
             </p>
          </div>
        </div>

        {/* Sidebar: AI Analysis */}
        <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
           <div className="flex-1 glass-panel rounded-[2.5rem] border-white/10 p-8 overflow-y-auto scrollbar-hide relative bg-gradient-to-b from-red-500/5 to-transparent">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-sm uppercase tracking-widest text-red-500 flex items-center gap-3">
                   <i className="fa-solid fa-microchip"></i>
                   Nexus Haber Asistanı
                </h3>
                <button 
                  onClick={handleAiAnalyze}
                  disabled={isAiAnalyzing}
                  className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isAiAnalyzing ? <i className="fa-solid fa-sync animate-spin"></i> : <i className="fa-solid fa-bolt-lightning"></i>}
                </button>
              </div>

              {!aiAnalysis && !isAiAnalyzing && (
                <div className="h-4/5 flex flex-col items-center justify-center text-center opacity-30 select-none">
                   <i className="fa-solid fa-rss text-6xl mb-6 text-red-500"></i>
                   <p className="text-sm font-bold uppercase tracking-widest">Bülten Analizi Bekleniyor</p>
                   <p className="text-[10px] italic mt-2">Kanal özetini almak için butona dokunun.</p>
                </div>
              )}

              {isAiAnalyzing && (
                <div className="space-y-4 animate-pulse">
                   <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
                   <div className="h-4 bg-white/5 rounded-full w-1/2"></div>
                   <div className="h-20 bg-white/5 rounded-3xl w-full"></div>
                </div>
              )}

              {aiAnalysis && (
                <div className="animate-fade-in">
                   <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-3xl italic text-sm leading-relaxed text-red-200 shadow-inner mb-6">
                      {aiAnalysis}
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hızlı Haber Aksiyonları</p>
                      <button className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-bold flex items-center justify-between">
                         Gündem Başlıklarını Getir
                         <i className="fa-solid fa-newspaper text-red-500"></i>
                      </button>
                      <button className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-bold flex items-center justify-between">
                         Haber Kaynağını Doğrula
                         <i className="fa-solid fa-check-circle text-emerald-500"></i>
                      </button>
                   </div>
                </div>
              )}
           </div>

           <div className="glass-panel p-6 rounded-3xl border-white/5 bg-red-600/5 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 blur-2xl -mr-12 -mt-12"></div>
              <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center justify-between relative z-10">
                 Haber Doğrulama Sistemi
                 <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] animate-pulse">SCANNING</span>
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed italic relative z-10">
                Nexus AI, Hürriyet ve diğer kaynaklardan gelen verileri çapraz sorgulayarak dezenformasyon riskini analiz eder.
              </p>
           </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TVView;
