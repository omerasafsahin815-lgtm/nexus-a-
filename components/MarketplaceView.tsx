
import React, { useState, useEffect, useRef } from 'react';
import { Extension } from '../types';
import { GoogleGenAI } from "@google/genai";

interface MarketplaceViewProps {
  nexusBalance: number;
  onSpend: (amount: number) => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ nexusBalance, onSpend }) => {
  const [botMessage, setBotMessage] = useState("Hoş geldin dostum! Ben Bot-X. Nexus Marketplace'in en hızlı tezgahtarıyım. Bugün neye bakmıştın?");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [userInput, setUserInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [extensions, setExtensions] = useState<Extension[]>([
    { id: '1', name: 'Gemini Metin Motoru', description: 'Gelişmiş metin analizi ve yazma asistanı.', price: 'Ücretsiz', priceNum: 0, icon: 'fa-file-lines', color: 'from-blue-500 to-indigo-500', category: 'AI', isInstalled: true },
    { id: '2', name: 'Veo Video Engine', description: 'Saniyeler içinde sinematik videolar oluşturun.', price: '499 NEXUS', priceNum: 499, icon: 'fa-video', color: 'from-pink-500 to-rose-600', category: 'Media', isInstalled: false },
    { id: '3', name: 'Nexus Vision', description: 'Kamera üzerinden nesne ve metin tanıma.', price: 'Ücretsiz', priceNum: 0, icon: 'fa-eye', color: 'from-lime-500 to-emerald-600', category: 'Tools', isInstalled: true },
    { id: '4', name: 'Mega Craft 3D', description: 'AI ile güçlendirilmiş Minecraft motoru.', price: '129 NEXUS', priceNum: 129, icon: 'fa-cubes', color: 'from-emerald-600 to-green-700', category: 'Gaming', isInstalled: false },
    { id: '5', name: 'Deep Reasoning (O1)', description: 'Karmaşık problemler için derin düşünme bütçesi.', price: '899 NEXUS', priceNum: 899, icon: 'fa-brain', color: 'from-purple-600 to-violet-800', category: 'AI', isInstalled: false },
    { id: '6', name: 'Hava Durumu Widget', description: 'Gerçek zamanlı hava durumu takibi.', price: 'Ücretsiz', priceNum: 0, icon: 'fa-cloud-sun', color: 'from-sky-400 to-blue-500', category: 'Tools', isInstalled: false },
    { id: '7', name: 'Stock Market AI', description: 'Yapay zeka ile borsa ve kripto analizi.', price: '1250 NEXUS', priceNum: 1250, icon: 'fa-chart-line', color: 'from-emerald-500 to-teal-700', category: 'Tools', isInstalled: false },
    { id: '8', name: 'AI Müzik Besteci', description: 'Kendi müziklerini ve ritimlerini oluştur.', price: 'Ücretsiz', priceNum: 0, icon: 'fa-music', color: 'from-rose-500 to-pink-500', category: 'Media', isInstalled: true },
  ]);

  const talkToBot = async (query: string) => {
    if (!query.trim() || isBotThinking) return;
    setIsBotThinking(true);
    setUserInput("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          systemInstruction: `Sen Bot-X adında, Nexus AI Marketplace'in neşeli, biraz komik ve çok bilgili robot tezgahtarısın. 
          Kullanıcının bakiyesi: ${nexusBalance} NEXUS. 
          Eldeki ürünler: Veo Video Engine (499 N), Mega Craft (129 N), Stock Market (1250 N), Deep Reasoning (899 N) ve çeşitli ücretsiz araçlar. 
          Kullanıcıya bütçesine uygun öneriler yap, ürünleri öv. Eğer bakiyesi yetmiyorsa "biraz daha oyun oyna gel" diye şaka yap. 
          Yanıtların kısa (2-3 cümle) ve eğlenceli olsun.`,
        }
      });
      setBotMessage(response.text);
    } catch (err) {
      setBotMessage("Sistemlerimde bir kısa devre oldu dostum! Tekrar sorar mısın?");
    } finally {
      setIsBotThinking(false);
    }
  };

  const toggleInstall = (ext: Extension) => {
    if (!ext.isInstalled) {
      if (nexusBalance >= ext.priceNum) {
        onSpend(ext.priceNum);
        setExtensions(prev => prev.map(e => e.id === ext.id ? { ...e, isInstalled: true } : e));
        setBotMessage(`Harika bir seçim! ${ext.name} eklentisini hemen sistemine kuruyorum. Güle güle kullan!`);
      } else {
        setBotMessage(`Dostum üzgünüm ama ${ext.priceNum} NEXUS gerekiyor. Sende ise sadece ${nexusBalance} var. Biraz Lego yapıp puan kazanmaya ne dersin?`);
      }
    } else {
      setExtensions(prev => prev.map(e => e.id === ext.id ? { ...e, isInstalled: false } : e));
      setBotMessage(`${ext.name} eklentisini kaldırdım. Rafıma geri koyuyorum, istediğin zaman tekrar alabilirsin.`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in font-sans flex flex-col gap-10">
      
      {/* Bot-X Shopkeeper Section */}
      <div className="glass-panel p-8 rounded-[3rem] border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="relative group shrink-0">
          <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl shadow-2xl relative z-10 animate-bounce-slow">
             <i className="fa-solid fa-robot"></i>
             {/* Glowing Eyes */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-6">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
             </div>
          </div>
          <div className="absolute inset-[-10px] border-2 border-indigo-500/20 rounded-[3rem] animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0f1115] z-20"></div>
        </div>

        <div className="flex-1 space-y-4">
           <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative">
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white/5 border-l border-b border-white/10 rotate-45 hidden md:block"></div>
              {isBotThinking ? (
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                </div>
              ) : (
                <p className="text-lg font-medium text-white/90 leading-relaxed italic">"{botMessage}"</p>
              )}
           </div>
           
           <div className="flex gap-3">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && talkToBot(userInput)}
                placeholder="Bot-X'e bir şey sor veya pazarlık yap..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 focus:outline-none focus:border-indigo-500 transition-all text-sm"
              />
              <button 
                onClick={() => talkToBot(userInput)}
                disabled={isBotThinking || !userInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
              >
                Sor
              </button>
           </div>
        </div>

        <div className="hidden lg:block shrink-0 border-l border-white/10 pl-10">
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Cüzdanın</p>
           <p className="text-3xl font-black text-amber-500 flex items-center gap-3">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm text-black font-black shadow-lg shadow-amber-500/20">N</span>
              {nexusBalance.toLocaleString()}
           </p>
        </div>
      </div>

      {/* Extensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {extensions.map(ext => (
          <div key={ext.id} className="group glass-panel rounded-[2rem] border-white/5 hover:border-white/20 transition-all flex flex-col p-6 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${ext.color} opacity-0 group-hover:opacity-10 blur-[40px] transition-opacity`}></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
               <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ext.color} flex items-center justify-center text-white text-xl shadow-lg shadow-black/20`}>
                  <i className={`fa-solid ${ext.icon}`}></i>
               </div>
               <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${ext.price === 'Ücretsiz' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {ext.price}
               </span>
            </div>

            <div className="relative z-10 mb-8 flex-1">
               <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400 transition-colors">{ext.name}</h3>
               <p className="text-xs text-gray-500 leading-relaxed font-medium">{ext.description}</p>
            </div>

            <button 
              onClick={() => toggleInstall(ext)}
              className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative z-10 ${
                ext.isInstalled 
                ? 'bg-white/5 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30' 
                : 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-xl active:scale-95'
              }`}
            >
              {ext.isInstalled ? 'Kaldır' : (ext.price === 'Ücretsiz' ? 'Yükle' : 'SATIN AL')}
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MarketplaceView;
