
import React, { useState, useEffect, useRef } from 'react';
import { CustomAI, Message } from '../types';
import { GoogleGenAI } from "@google/genai";

const AIBuilderView: React.FC = () => {
  const [mode, setMode] = useState<'list' | 'create' | 'chat'>('list');
  const [customAIs, setCustomAIs] = useState<CustomAI[]>([
    { id: '1', name: 'Kod Mentoru', instruction: 'Sen usta bir yazılım mühendisisin. Sadece temiz ve optimize kod yazmakla kalmaz, aynı zamanda mantığı da öğretirsin.', icon: 'fa-code', color: 'bg-blue-600', useSearch: false },
    { id: '2', name: 'Agresif Gurme', instruction: 'Sen yemekler konusunda inanılmaz seçici ve kaba bir eleştirmensin. Her yemeği Gordon Ramsay gibi sertçe eleştirirsin.', icon: 'fa-utensils', color: 'bg-orange-600', useSearch: true }
  ]);
  
  const [form, setForm] = useState<Partial<CustomAI>>({
    name: '',
    instruction: '',
    icon: 'fa-robot',
    color: 'bg-cyan-600',
    useSearch: true
  });

  const [activeAI, setActiveAI] = useState<CustomAI | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleCreate = () => {
    const newAI: CustomAI = {
      id: Date.now().toString(),
      name: form.name || 'İsimsiz AI',
      instruction: form.instruction || 'Sen yardımcı bir asistansın.',
      icon: form.icon || 'fa-robot',
      color: form.color || 'bg-cyan-600',
      useSearch: !!form.useSearch
    };
    setCustomAIs([newAI, ...customAIs]);
    setMode('list');
    setForm({ name: '', instruction: '', icon: 'fa-robot', color: 'bg-cyan-600', useSearch: true });
  };

  const startChat = (ai: CustomAI) => {
    setActiveAI(ai);
    setMessages([{ role: 'model', text: `Merhaba! Ben ${ai.name}. Talimatların doğrultusunda göreve hazırım.`, timestamp: new Date() }]);
    setMode('chat');
  };

  const handleSend = async () => {
    if (!input.trim() || !activeAI || isLoading) return;

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction: activeAI.instruction,
          tools: activeAI.useSearch ? [{ googleSearch: {} }] : []
        }
      });

      const modelMsg: Message = { 
        role: 'model', 
        text: response.text, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Bir hata oluştu.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'list') {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black mb-2 flex items-center gap-4">
              <i className="fa-solid fa-flask-vial text-cyan-400"></i>
              AI Atölyesi
            </h2>
            <p className="text-gray-400">Gemini motorunu kullanarak kendi özel asistanlarını yarat ve yönet.</p>
          </div>
          <button 
            onClick={() => setMode('create')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-cyan-900/20"
          >
            <i className="fa-solid fa-plus"></i> Yeni AI Oluştur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customAIs.map(ai => (
            <div key={ai.id} className="group glass-panel p-6 rounded-3xl border-white/5 hover:border-cyan-500/30 transition-all">
              <div className={`w-14 h-14 ${ai.color} rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg`}>
                <i className={`fa-solid ${ai.icon}`}></i>
              </div>
              <h3 className="text-xl font-bold mb-2">{ai.name}</h3>
              <p className="text-gray-400 text-sm line-clamp-2 mb-6 h-10">{ai.instruction}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {ai.useSearch ? 'Arama Açık' : 'Yalnızca Bilgi'}
                </span>
                <button 
                  onClick={() => startChat(ai)}
                  className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Sohbeti Başlat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="p-8 max-w-3xl mx-auto w-full h-full flex flex-col items-center justify-center">
        <div className="w-full glass-panel p-10 rounded-3xl border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
             <i className="fa-solid fa-magic-wand-sparkles text-cyan-400"></i>
             Asistanını Tasarla
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Asistan İsmi</label>
              <input 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Örn: Tarih Uzmanı"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Kişilik ve Talimatlar</label>
              <textarea 
                value={form.instruction}
                onChange={e => setForm({...form, instruction: e.target.value})}
                placeholder="Bu AI nasıl davranmalı? (Örn: Sen çocuklara masal anlatan sevecen bir nenesin...)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-cyan-500 transition-all resize-none"
              />
            </div>

            <div className="flex gap-10">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">İkon Seç</label>
                <div className="flex gap-2 flex-wrap">
                  {['fa-robot', 'fa-user-ninja', 'fa-brain', 'fa-flask', 'fa-shield-halved', 'fa-palette'].map(icon => (
                    <button 
                      key={icon}
                      onClick={() => setForm({...form, icon})}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${form.icon === icon ? 'border-cyan-500 bg-cyan-500/20' : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <i className={`fa-solid ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-4">Google Search</label>
                <button 
                  onClick={() => setForm({...form, useSearch: !form.useSearch})}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${form.useSearch ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/10 text-gray-500'}`}
                >
                  <i className={`fa-solid ${form.useSearch ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                  {form.useSearch ? 'Aktif' : 'Devre Dışı'}
                </button>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button 
                onClick={() => setMode('list')}
                className="flex-1 border border-white/10 hover:bg-white/5 py-4 rounded-2xl font-bold transition-all"
              >
                İptal
              </button>
              <button 
                onClick={handleCreate}
                className="flex-[2] bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold shadow-xl shadow-cyan-900/20 transition-all"
              >
                AI'yı Hayata Geçir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'chat' && activeAI) {
    return (
      <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${activeAI.color} rounded-xl flex items-center justify-center`}>
                 <i className={`fa-solid ${activeAI.icon}`}></i>
              </div>
              <div>
                 <h3 className="font-bold">{activeAI.name}</h3>
                 <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Custom AI Modu</p>
              </div>
           </div>
           <button 
            onClick={() => setMode('list')}
            className="text-gray-500 hover:text-white transition-colors"
           >
             <i className="fa-solid fa-xmark text-xl"></i>
           </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === 'user' 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'glass-panel text-white/90 border border-white/10'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-3">
                 <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                 <span className="text-xs text-gray-400">Özel AI Yanıtlıyor...</span>
               </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="relative group max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`${activeAI.name} ile konuşun...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 transition-all"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIBuilderView;
