
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';
import { gemini } from '../services/gemini';

const GameView: React.FC = () => {
  const [gameState, setGameState] = useState<'selection' | 'playing'>('selection');
  const [theme, setTheme] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSceneImg, setCurrentSceneImg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const themes = [
    { id: 'fantasy', name: 'Epik Fantazi', icon: 'fa-dragon', color: 'from-amber-500 to-red-600', prompt: 'Orta Dünya tarzı bir büyü dünyasında geçen bir macera.' },
    { id: 'scifi', name: 'Cyberpunk 2099', icon: 'fa-user-robot', color: 'from-blue-500 to-purple-600', prompt: 'Yüksek teknoloji, düşük yaşam kalitesi ve neon ışıklı bir gelecek.' },
    { id: 'horror', name: 'Korku Köşkü', icon: 'fa-ghost', color: 'from-gray-700 to-black', prompt: 'Terk edilmiş, gizemli ve ürpertici bir evde hayatta kalma mücadelesi.' },
    { id: 'mystery', name: 'Dedektiflik', icon: 'fa-magnifying-glass', color: 'from-emerald-500 to-teal-700', prompt: '1920lerin Londrasında çözülmeyi bekleyen karanlık bir cinayet davası.' },
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const startGame = async (selectedTheme: typeof themes[0]) => {
    setTheme(selectedTheme.name);
    setGameState('playing');
    setIsLoading(true);
    
    const initialPrompt = `Yeni bir "${selectedTheme.name}" macerasına başla. ${selectedTheme.prompt} Hikayeyi başlat ve bana nerede olduğumu, neler gördüğümü anlat. Kısa ve sürükleyici ol. Sonunda ne yapmak istediğimi sor.`;
    
    await handleGameTurn(initialPrompt, true);
  };

  const handleGameTurn = async (userAction: string, isFirst: boolean = false) => {
    setIsLoading(true);
    if (!isFirst) {
      setMessages(prev => [...prev, { role: 'user', text: userAction, timestamp: new Date() }]);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: isFirst ? userAction : [
            ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            { role: 'user', parts: [{ text: userAction }] }
        ],
        config: {
          systemInstruction: `Sen usta bir RPG Oyun Yöneticisisin (Game Master). 
          Kullanıcıya seçtiği temada interaktif, sürükleyici ve zorlu bir hikaye sunuyorsun. 
          Yanıtların 3-4 paragrafı geçmesin. 
          Her yanıtın sonunda kullanıcıya 3 mantıklı aksiyon seçeneği sun. 
          Dili her zaman Türkçe olsun.`,
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });

      const modelText = response.text;
      setMessages(prev => [...prev, { role: 'model', text: modelText, timestamp: new Date() }]);
      
      // Try to generate an image for the scene asynchronously
      try {
        const imgPrompt = `A digital art illustration of this scene: ${modelText.substring(0, 300)}. Artistic style: ${theme} cinematic aesthetic.`;
        const imgUrl = await gemini.generateImage(imgPrompt, "16:9");
        setCurrentSceneImg(imgUrl);
      } catch (e) {
        console.warn("Scene image generation failed", e);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Zindan karanlığa büründü... Bir hata oluştu. Lütfen tekrar deneyin.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  if (gameState === 'selection') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 tracking-tight">MACERA BAŞLIYOR</h2>
          <p className="text-gray-400 max-w-md mx-auto">Gemini 3 Pro zekasıyla kurgulanan, senin kararlarınla şekillenen sonsuz bir hikayeye adım at.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => startGame(t)}
              className="group relative overflow-hidden glass-panel p-8 rounded-3xl border-white/5 hover:border-white/20 transition-all text-left hover:-translate-y-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-3xl shadow-lg`}>
                  <i className={`fa-solid ${t.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{t.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.prompt}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0c10]">
      {/* Top Banner with current scene image */}
      <div className="relative h-64 md:h-80 w-full flex-shrink-0">
        {currentSceneImg ? (
          <img src={currentSceneImg} className="w-full h-full object-cover opacity-60 transition-opacity duration-1000" alt="Scene" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-indigo-900/20 to-[#0a0c10]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent"></div>
        <div className="absolute bottom-6 left-8">
          <span className="bg-red-600 text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block uppercase tracking-widest">Canlı Macera</span>
          <h2 className="text-3xl font-bold text-white shadow-sm">{theme}</h2>
        </div>
        <button 
            onClick={() => { setGameState('selection'); setMessages([]); setCurrentSceneImg(null); }}
            className="absolute top-6 right-8 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md transition-all"
        >
            <i className="fa-solid fa-arrow-left mr-2"></i> Çıkış Yap
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full px-4 -mt-10 relative z-20">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 pb-24 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-6 py-5 ${
                msg.role === 'user' 
                  ? 'bg-red-600 text-white shadow-xl' 
                  : 'glass-panel text-gray-200 border-white/5 leading-relaxed italic font-serif text-lg'
              }`}>
                {msg.text.split('\n').map((para, idx) => (
                  <p key={idx} className={para.trim() ? "mb-4" : ""}>{para}</p>
                ))}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3">
                <i className="fa-solid fa-dice-d20 animate-spin text-red-500"></i>
                <span className="text-sm font-bold text-gray-500 italic">Game Master senaryoyu yazıyor...</span>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0c10] to-transparent">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGameTurn(input)}
              placeholder="Ne yapmak istiyorsun? (Kaderini kendin yaz...)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-red-500 transition-all shadow-2xl backdrop-blur-xl"
            />
            <button
              onClick={() => handleGameTurn(input)}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
            >
              <i className="fa-solid fa-bolt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
