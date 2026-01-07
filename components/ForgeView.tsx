
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

const ForgeView: React.FC = () => {
  const [selectedKernel, setSelectedKernel] = useState('nexus');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const kernels = [
    { id: 'nexus', name: 'Nexus Core', provider: 'Gemini 3 Pro', desc: 'Dengeli ve ultra hızlı çekirdek.', color: 'from-blue-500 to-indigo-600', icon: 'fa-atom', system: 'Sen Nexus AI asistanısın. Direkt ve net cevaplar ver.' },
    { id: 'gpt', name: 'G-Persona', provider: 'GPT-4 Simulation', desc: 'Daha konuşkan, detaycı ve yapılandırılmış stil.', color: 'from-emerald-500 to-teal-600', icon: 'fa-bolt', system: 'Sen ChatGPT (GPT-4) stilinde bir asistansın. Yanıtların her zaman detaylı, nazik ve çok yapılı (listeleyerek, başlıklandırarak) olmalı.' },
    { id: 'claude', name: 'Logic Master', provider: 'Claude Simulation', desc: 'Mantık ve dökümantasyon uzmanı.', color: 'from-orange-500 to-amber-600', icon: 'fa-scroll', system: 'Sen Claude 3 stilinde bir asistansın. Çok dürüst, etik değerlere önem veren ve teknik dökümantasyon konusunda kusursuz olmalısın.' },
    { id: 'deep', name: 'Deep Thinker', provider: 'Gemini 3 Pro Turbo', desc: 'Zorlu problemler için 32K düşünme bütçesi.', color: 'from-purple-600 to-pink-700', icon: 'fa-brain', system: 'Sen derinlemesine düşünen bir bilim insanısın. Adım adım mantık yürüt.' }
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const currentKernel = kernels.find(k => k.id === selectedKernel)!;
    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: currentKernel.system,
          thinkingConfig: { thinkingBudget: selectedKernel === 'deep' ? 32000 : 8000 }
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text, timestamp: new Date() }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Sinyal kesildi. Lütfen tekrar deneyin.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#050608] animate-fade-in overflow-hidden relative">
      {/* Background Matrix Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Sidebar: Kernel Selection */}
      <div className="w-80 border-r border-white/5 p-8 flex flex-col gap-8 bg-black/40 backdrop-blur-3xl z-10">
        <div>
           <h2 className="text-2xl font-black mb-2 tracking-tighter text-white">NEXUS FORGE</h2>
           <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.3em]">Universal AI Bridge</p>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Çekirdek Seçimi</p>
          {kernels.map(k => (
            <button
              key={k.id}
              onClick={() => setSelectedKernel(k.id)}
              className={`w-full p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                selectedKernel === k.id 
                ? `border-white/20 bg-gradient-to-br ${k.color} shadow-lg` 
                : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedKernel === k.id ? 'bg-white/20' : 'bg-gray-800'}`}>
                   <i className={`fa-solid ${k.icon} ${selectedKernel === k.id ? 'text-white' : 'text-gray-500'}`}></i>
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${selectedKernel === k.id ? 'text-white' : 'text-gray-300'}`}>{k.name}</h4>
                  <p className={`text-[10px] ${selectedKernel === k.id ? 'text-white/60' : 'text-gray-500'}`}>{k.provider}</p>
                </div>
              </div>
              <p className={`mt-3 text-[10px] leading-relaxed italic ${selectedKernel === k.id ? 'text-white/80' : 'text-gray-500'}`}>
                {k.desc}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-auto glass-panel p-5 rounded-2xl border-white/5">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-500 uppercase">Durum</span>
              <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                 Senkronize
              </span>
           </div>
           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 w-[94%]"></div>
           </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative z-10">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none">
               <i className={`fa-solid ${kernels.find(k=>k.id===selectedKernel)?.icon} text-9xl mb-8`}></i>
               <h3 className="text-4xl font-black">{kernels.find(k=>k.id===selectedKernel)?.name} Hazır</h3>
               <p className="text-xl italic mt-2">Evrensel Protokol Aktif Edildi</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[80%] p-6 rounded-3xl border ${
                msg.role === 'user' 
                ? 'bg-orange-600/10 border-orange-500/30 text-white shadow-2xl' 
                : 'bg-white/5 border-white/10 text-gray-200 leading-relaxed'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase mt-4 tracking-widest">
                   {msg.role === 'user' ? 'Giriş Sinyali' : `${kernels.find(k=>k.id===selectedKernel)?.name} Yanıtı`}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-4">
                 <i className="fa-solid fa-sync animate-spin text-orange-500"></i>
                 <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Köprü üzerinden veri aktarılıyor...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-10 bg-gradient-to-t from-black to-transparent">
           <div className="max-w-4xl mx-auto relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`${kernels.find(k=>k.id===selectedKernel)?.name} çekirdeğine bir komut gönder...`}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 pr-20 focus:outline-none focus:border-orange-500 transition-all text-white backdrop-blur-3xl shadow-2xl"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all disabled:opacity-30"
              >
                 <i className="fa-solid fa-paper-plane"></i>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ForgeView;
