
import React, { useState, useEffect } from 'react';
import { View } from '../types';

interface HomeViewProps {
  username: string;
  setView: (view: View) => void;
  nexusBalance: number;
}

const HomeView: React.FC<HomeViewProps> = ({ username, setView, nexusBalance }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState<string[]>([
    "Nexus Kernel v4.0.2 başlatıldı...",
    "Kuantum şifreleme katmanı aktif.",
    "Gemini 3 Pro motoru senkronize edildi.",
    "Bakiye kontrol ediliyor..."
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const logTimer = setInterval(() => {
      const newLogs = [
        "Sistem verimliliği %98.4",
        "NEXUS ağı genişletiliyor...",
        "Yeni görevler yüklendi.",
        "Güvenlik duvarı stabil.",
        "AI nöronları optimize ediliyor."
      ];
      setLogs(prev => [...prev.slice(-3), newLogs[Math.floor(Math.random() * newLogs.length)]]);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(logTimer);
    };
  }, []);

  const hours = currentTime.getHours();
  const greeting = hours < 12 ? 'Günaydın' : hours < 18 ? 'Tünaydın' : 'İyi Akşamlar';

  const categories = [
    {
      title: "Yapay Zeka Laboratuvarı",
      items: [
        { id: View.CHAT, title: 'Mega Chat', icon: 'fa-comments', color: 'bg-blue-500' },
        { id: View.CONVERSATION, title: 'Empati Modu', icon: 'fa-face-smile-wink', color: 'bg-indigo-600' },
        { id: View.VISION, title: 'Vision Lab', icon: 'fa-eye', color: 'bg-lime-500' },
        { id: View.FORGE, title: 'Nexus Forge', icon: 'fa-microchip', color: 'bg-orange-500' },
      ]
    },
    {
      title: "Yaratıcılık Stüdyosu",
      items: [
        { id: View.IMAGE, title: 'Görsel Üret', icon: 'fa-wand-magic-sparkles', color: 'bg-purple-500' },
        { id: View.VIDEO, title: 'Video (Veo)', icon: 'fa-video', color: 'bg-pink-500' },
        { id: View.MUSIC, title: 'Music Studio', icon: 'fa-music', color: 'bg-rose-500' },
        { id: View.CODER, title: 'DevStudio', icon: 'fa-code', color: 'bg-indigo-500' },
      ]
    },
    {
      title: "Eğlence ve Oyun",
      items: [
        { id: View.LEGO, title: 'Lego Builder', icon: 'fa-shapes', color: 'bg-yellow-500' },
        { id: View.MINECRAFT, title: 'Mega Craft', icon: 'fa-cubes', color: 'bg-emerald-600' },
        { id: View.SURF, title: 'Extreme Surf', icon: 'fa-water', color: 'bg-cyan-500' },
        { id: View.SPACE_INVADERS, title: 'Space Quest', icon: 'fa-shuttle-space', color: 'bg-slate-700' },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in space-y-12">
      
      {/* Hero Header Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] -mr-32 -mt-32 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-indigo-500/20 text-indigo-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                  Nexus Protocol v4.0.2
                </span>
                <span className="text-gray-500 text-[10px] font-bold">
                  {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-6xl font-black mb-4 tracking-tighter leading-tight">
                {greeting}, <span className="text-transparent bg-clip-text ai-gradient">{username}</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl font-medium">
                Sistemler %100 kapasite ile çalışıyor. Gemini 3 Pro çekirdeği emirlerini bekliyor.
              </p>
            </div>
          </div>

          {/* Mini Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nexus Bakiye</span>
              <span className="text-2xl font-black text-amber-500">{nexusBalance.toLocaleString()} N</span>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Enerji Seviyesi</span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-emerald-500">%94</span>
                <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 w-[94%]"></div>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Aktif İşlem</span>
              <span className="text-2xl font-black text-indigo-400">0</span>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col justify-center">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Sunucu Gecikmesi</span>
              <span className="text-2xl font-black text-rose-500">12ms</span>
            </div>
          </div>
        </div>

        {/* Sidebar Status Widget */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 h-full relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-sm uppercase tracking-widest text-white/50">Sistem Logları</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
             </div>
             <div className="font-mono text-[11px] space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-emerald-500/80">
                    <span className="opacity-30">[{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                    <span className="flex-1">> {log}</span>
                  </div>
                ))}
                <div className="animate-pulse">> _</div>
             </div>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-amber-500/5 group cursor-pointer" onClick={() => setView(View.MARKETPLACE)}>
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <div>
                   <h4 className="font-black text-sm uppercase">Market Teklifi</h4>
                   <p className="text-[10px] text-amber-500/70 font-bold uppercase tracking-widest">Sana Özel %20 İndirim</p>
                </div>
             </div>
             <p className="text-xs text-gray-500 italic">"Gelişmiş Vision motorunu sadece 299 N karşılığında açabilirsin!"</p>
          </div>
        </div>
      </div>

      {/* Main Apps Grid */}
      <div className="space-y-12 pb-20">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-6">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] px-2">{cat.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cat.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className="group relative overflow-hidden glass-panel p-8 rounded-[2rem] border-white/5 hover:border-white/20 transition-all text-left hover:-translate-y-2 shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center text-white text-2xl mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <h4 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{item.title}</h4>
                  <div className="flex items-center justify-between mt-4">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Açmak İçin Tıkla</span>
                     <i className="fa-solid fa-arrow-right text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all"></i>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Global Quest HUD */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
        <div className="glass-panel p-6 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl flex items-center justify-between gap-10">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 border border-white/10">
                 <i className="fa-solid fa-trophy"></i>
              </div>
              <div>
                 <h4 className="font-black text-xs uppercase tracking-widest">Mega Builder Görevi</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 w-[45%]"></div>
                    </div>
                    <span className="text-[10px] font-black text-amber-500">45/100 Blok</span>
                 </div>
              </div>
           </div>
           <div className="text-right shrink-0">
              <p className="text-[10px] font-black text-gray-500 uppercase">Ödül</p>
              <p className="text-xl font-black text-white">5,000 N</p>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default HomeView;
