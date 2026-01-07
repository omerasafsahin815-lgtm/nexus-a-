
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const CoderView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickTools = [
    { name: 'Refactor', prompt: 'Şu kodu daha optimize ve temiz yaz: ', icon: 'fa-wand-magic-sparkles' },
    { name: 'Explain', prompt: 'Şu kodu satır satır açıkla: ', icon: 'fa-chalkboard' },
    { name: 'Debug', prompt: 'Şu koddaki hataları bul ve düzelt: ', icon: 'fa-bug' },
    { name: 'Unit Test', prompt: 'Şu kod için kapsamlı test senaryoları yaz: ', icon: 'fa-vial' },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt ? customPrompt + prompt : prompt;
    if (!finalPrompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: finalPrompt,
        config: {
          systemInstruction: 'Sen dünya çapında bir kıdemli yazılım mühendisisin. Yanıtlarını Markdown formatında ver ve kod blokları için mutlaka dil belirt (```javascript vb.). Karmaşık sorunları basitleştirerek anlat.',
          thinkingConfig: { thinkingBudget: 8000 }
        }
      });
      setCodeOutput(response.text);
    } catch (err) {
      console.error(err);
      setCodeOutput("### HATA\nKod motoru ile bağlantı kurulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-[#0d1117] animate-fade-in font-mono overflow-hidden">
      {/* Sidebar / Tools */}
      <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-6 bg-[#010409]">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Hızlı Araçlar</h3>
        <div className="space-y-2">
          {quickTools.map(tool => (
            <button
              key={tool.name}
              onClick={() => handleGenerate(tool.prompt)}
              disabled={isLoading || !prompt.trim()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-xs text-left group disabled:opacity-30"
            >
              <i className={`fa-solid ${tool.icon} text-indigo-400 group-hover:scale-110 transition-transform`}></i>
              <span className="font-bold">{tool.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-[10px] text-indigo-300 leading-relaxed italic">
            "İyi kod yazmak için önce kötü kod yazmanız gerekir." - Nexus Dev
          </p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Terminal Header */}
        <div className="h-12 border-b border-white/5 flex items-center px-6 justify-between bg-[#010409]">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
             </div>
             <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">nexus-dev-terminal v2.0</span>
          </div>
          <div className="text-[10px] text-indigo-500 font-black animate-pulse">
            CONNECTED TO GEMINI_3_PRO
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide" ref={scrollRef}>
          {!codeOutput && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 select-none">
              <i className="fa-solid fa-code text-9xl mb-6"></i>
              <p className="text-xl">Kodunuzu veya sorunuzu aşağıya yazın</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-4 text-indigo-400 animate-pulse">
                  <i className="fa-solid fa-terminal"></i>
                  <span className="text-sm font-bold">Nexus AI düşüncelerini koda döküyor...</span>
               </div>
               <div className="space-y-2">
                  <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-white/5 rounded-full w-2/3 animate-pulse"></div>
               </div>
            </div>
          )}

          {codeOutput && (
            <div className="prose prose-invert max-w-none prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-white/5 prose-code:text-indigo-300">
               {/* Markdown içeriği buraya gelecek */}
               <div className="bg-white/5 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                  {codeOutput}
               </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-6 border-t border-white/5 bg-[#010409]">
           <div className="relative group max-w-5xl mx-auto">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Kodunuzu buraya yapıştırın veya 'Python ile snake oyunu yap' deyin..."
                className="w-full bg-[#0d1117] border border-white/10 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-indigo-500 transition-all text-sm resize-none h-32 scrollbar-hide"
              />
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isLoading}
                className="absolute right-4 bottom-4 w-12 h-12 ai-gradient rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <i className="fa-solid fa-bolt-lightning"></i>
              </button>
           </div>
           <div className="mt-3 flex justify-center gap-6 opacity-30 text-[10px] font-bold uppercase tracking-widest">
              <span>Shift + Enter: Yeni Satır</span>
              <span>CTRL + Enter: Çalıştır</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CoderView;
