
import React, { useState, useRef, useEffect } from 'react';
import { gemini } from '../services/gemini';
import { Message } from '../types';

interface ChatViewProps {
  onEarnPoints: (amount: number, reason: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onEarnPoints }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Merhaba! Ben Nexus Mega AI. Bugün size nasıl yardımcı olabilirim? Detaylı sorular sorarak daha fazla NEXUS kazanabilirsin!', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Gamification: Reward long, detailed questions
    const wordCount = input.trim().split(/\s+/).length;
    if (wordCount > 15) {
      onEarnPoints(50, 'Derinlemesine Sorgu Bonusu');
    } else if (wordCount > 5) {
      onEarnPoints(10, 'Sorgu Ödülü');
    }

    const userMsg: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await gemini.generateText(input);
      const modelMsg: Message = { 
        role: 'model', 
        text: response.text, 
        timestamp: new Date(),
        groundingLinks: response.grounding
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'glass-panel text-white/90 border border-white/10'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-[10px] uppercase font-bold text-indigo-300 mb-2">Kaynaklar</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 flex items-center gap-1 transition-colors"
                      >
                        <i className="fa-solid fa-link text-[10px]"></i>
                        {link.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-[10px] opacity-40 mt-2 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-panel px-5 py-4 rounded-2xl flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-xs text-gray-400">Mega AI düşünüyor...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0f1115]">
        <div className="relative group max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Neyi merak ediyorsun? Detaylı sorarsan NEXUS kazanırsın..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-indigo-500 transition-all resize-none shadow-inner h-24"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 bottom-4 w-10 h-10 ai-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-500 mt-2">
          Nexus Mega Chat • 15+ kelimelik cümleler 50 NEXUS kazandırır!
        </p>
      </div>
    </div>
  );
};

export default ChatView;
