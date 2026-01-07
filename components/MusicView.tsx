
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const MusicView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const pianoNotes = [
    { note: 'C4', freq: 261.63, key: 'A' },
    { note: 'D4', freq: 293.66, key: 'S' },
    { note: 'E4', freq: 329.63, key: 'D' },
    { note: 'F4', freq: 349.23, key: 'F' },
    { note: 'G4', freq: 392.00, key: 'G' },
    { note: 'A4', freq: 440.00, key: 'H' },
    { note: 'B4', freq: 493.88, key: 'J' },
    { note: 'C5', freq: 523.25, key: 'K' },
  ];

  const drums = [
    { name: 'Kick', freq: 150, type: 'sine' as OscillatorType, key: '1' },
    { name: 'Snare', freq: 250, type: 'triangle' as OscillatorType, key: '2' },
    { name: 'Hi-Hat', freq: 1000, type: 'square' as OscillatorType, key: '3' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const pianoKey = pianoNotes.find(n => n.key === e.key.toUpperCase());
      if (pianoKey) playNote(pianoKey.freq);
      
      const drumKey = drums.find(d => d.key === e.key);
      if (drumKey) playDrum(drumKey.freq, drumKey.type);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playNote = (freq: number) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1);
  };

  const playDrum = (freq: number, type: OscillatorType) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const generateInspiration = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Müzik prodüksiyonu yapan bir üniversite öğrencisine yardımcı ol. Şu tema için akor dizisi, ritim önerisi ve kısa şarkı sözü yaz: "${prompt}"`,
        config: { temperature: 0.8 }
      });
      setAiSuggestion(response.text);
    } catch (err) {
      console.error(err);
      setAiSuggestion("AI Besteci şu an meşgul, lütfen sonra tekrar dene.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-black mb-2 tracking-tighter flex items-center gap-4">
          <i className="fa-solid fa-music text-rose-500"></i>
          Mega Music Studio
        </h2>
        <p className="text-gray-400">Üniversite projelerin için ilham al, bestele ve ritim tut.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* AI Composer Section */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 flex flex-col h-full">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
             <i className="fa-solid fa-brain text-rose-400"></i>
             AI Besteci Asistanı
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ne tarz bir müzik hayal ediyorsun? (Örn: Sınav haftası için lo-fi beat önerileri...)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:border-rose-500 transition-all text-sm mb-4"
          />
          <button
            onClick={generateInspiration}
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-rose-900/20 disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'İlham Al'}
          </button>

          {aiSuggestion && (
            <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/5 text-sm leading-relaxed text-gray-300 max-h-60 overflow-y-auto whitespace-pre-wrap italic">
              {aiSuggestion}
            </div>
          )}
        </div>

        {/* Instruments Section */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/10">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
             <i className="fa-solid fa-guitar text-rose-400"></i>
             Sanal Enstrümanlar
          </h3>
          
          <div className="mb-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Drum Pads (1, 2, 3 Tuşları)</p>
            <div className="grid grid-cols-3 gap-4">
              {drums.map(d => (
                <button
                  key={d.name}
                  onMouseDown={() => playDrum(d.freq, d.type)}
                  className="h-20 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 group"
                >
                  <span className="text-xs font-bold text-gray-400 group-hover:text-rose-400">{d.name}</span>
                  <span className="text-[10px] text-gray-600">{d.key}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Piyano (A'dan K'ya Tuşlar)</p>
            <div className="flex gap-1 overflow-x-auto pb-4">
              {pianoNotes.map(n => (
                <button
                  key={n.note}
                  onMouseDown={() => playNote(n.freq)}
                  className="flex-1 min-w-[50px] h-32 bg-white rounded-b-xl hover:bg-rose-100 transition-all active:h-28 flex flex-col items-center justify-end pb-4 shadow-xl"
                >
                  <span className="text-black text-xs font-black">{n.key}</span>
                  <span className="text-gray-400 text-[9px] uppercase">{n.note}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[2rem] border-white/5 text-center">
         <p className="text-sm text-gray-500 italic">"Müzik, ruhun üniversitesidir." — Projeniz için bu araçları dilediğiniz gibi kullanın.</p>
      </div>
    </div>
  );
};

export default MusicView;
