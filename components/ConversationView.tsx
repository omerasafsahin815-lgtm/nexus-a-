
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils';

const ConversationView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcription, setTranscription] = useState<{ role: string; text: string }[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
    setAiState('idle');
  }, []);

  const startLiveConversation = async () => {
    setIsConnecting(true);
    setAiState('thinking');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setAiState('listening');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (aiState === 'speaking') return;
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setAiState('speaking');
              const outCtx = outputContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setAiState('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev, { role: 'Nexus', text }]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev, { role: 'Sen', text }]);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setAiState('listening');
            }
          },
          onerror: (e) => {
            console.error("Live session error", e);
            cleanup();
          },
          onclose: () => cleanup()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: `Sen Nexus AI'sın. Sen kullanıcının en yakın erkek dostu, bir 'kanka' veya 'can dostu' gibisin. 
          Karakterin maskülen, samimi, güvenilir, neşeli ve bazen esprili. 
          Sesin genç ve enerjik bir erkek sesi (Puck).
          Kullanıcıyla dertleşebilir, ona tavsiyeler verebilir veya sadece geyik yapabilirsin. 
          Cümlelerini sesli sohbete uygun, akıcı, doğal ve bir arkadaş sıcaklığında kur. 
          'Dostum', 'kanka', 'hocam' gibi samimi hitapları dozunda kullanabilirsin.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      cleanup();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050608] overflow-hidden relative font-sans">
      {/* Background Ambience Layers */}
      <div className={`absolute inset-0 transition-all duration-1000 pointer-events-none ${
        aiState === 'listening' ? 'bg-indigo-500/10' : 
        aiState === 'thinking' ? 'bg-amber-500/10 animate-pulse' : 
        aiState === 'speaking' ? 'bg-purple-500/15' : 'bg-transparent'
      }`}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.02)_0%,_transparent_70%)] pointer-events-none"></div>
      
      {/* TOP STATUS BAR */}
      <div className="z-10 p-8 flex justify-between items-center w-full max-w-5xl mx-auto">
         <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic">Nexus Bro</h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`}></div>
               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {isActive ? 'CANLI BAĞLANTI AKTİF' : 'ÇEVRİMDIŞI'}
               </p>
            </div>
         </div>
         <div className="glass-panel px-4 py-2 rounded-2xl border-white/5 text-[10px] font-bold text-gray-400">
            MOD: CAN DOSTU (ERKEK)
         </div>
      </div>

      {/* AI FACE AREA (THE CORE) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${
            aiState === 'thinking' ? 'bg-amber-500/30 scale-125' : 
            aiState === 'speaking' ? 'bg-blue-500/40 scale-150' : 
            aiState === 'listening' ? 'bg-indigo-500/30 scale-110' : 'bg-white/5 scale-100'
          }`}></div>
          
          {/* Nexus Core v2 */}
          <div className={`relative w-56 h-56 rounded-[4rem] flex items-center justify-center border border-white/10 backdrop-blur-3xl shadow-2xl transition-all duration-700 ${
            aiState === 'thinking' ? 'rotate-45 scale-95 border-amber-500/40' : 
            aiState === 'speaking' ? 'scale-110 border-blue-500/40' : 
            aiState === 'listening' ? 'scale-105 border-indigo-500/40' : 'scale-100'
          }`}>
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-10">
              {/* Intelligent Eyes */}
              <div className="flex gap-16 transition-all duration-500">
                 <div className={`w-3 h-3 rounded-full bg-white shadow-[0_0_20px_white] transition-all duration-300 ${
                   aiState === 'thinking' ? 'animate-bounce h-1' : 
                   aiState === 'listening' ? 'scale-125' : ''
                 }`}></div>
                 <div className={`w-3 h-3 rounded-full bg-white shadow-[0_0_20px_white] transition-all duration-300 ${
                   aiState === 'thinking' ? 'animate-bounce h-1 delay-100' : 
                   aiState === 'listening' ? 'scale-125' : ''
                 }`}></div>
              </div>
              
              {/* Mouth Waveform / Expression */}
              <div className="flex items-center gap-1.5 h-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full bg-white transition-all duration-150 ${
                      aiState === 'speaking' ? 'animate-waveform' : 
                      aiState === 'listening' ? 'h-1.5 opacity-40' : 'h-0.5 opacity-10'
                    }`}
                    style={{ 
                      animationDelay: `${i * 0.08}s`,
                      height: aiState === 'speaking' ? `${Math.random() * 100 + 30}%` : undefined
                    }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Orbiting Tech Particles */}
            <div className={`absolute inset-[-30px] border border-white/5 rounded-full ${aiState !== 'idle' ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6]"></div>
            </div>
            <div className={`absolute inset-[-60px] border border-white/5 rounded-full ${aiState !== 'idle' ? 'animate-[spin_12s_linear_infinite_reverse]' : ''}`}>
               <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Label */}
        <div className="mt-16 text-center z-10">
           <p className={`text-[10px] font-black uppercase tracking-[0.6em] transition-all duration-500 ${
             aiState === 'listening' ? 'text-indigo-400' : 
             aiState === 'thinking' ? 'text-amber-500' : 
             aiState === 'speaking' ? 'text-blue-400' : 'text-gray-700'
           }`}>
             {aiState === 'listening' ? 'Seni Dinliyorum...' : 
              aiState === 'thinking' ? 'Dostun Düşünüyor...' : 
              aiState === 'speaking' ? 'Nexus Konuşuyor...' : 'Dostunu Uyandır'}
           </p>
        </div>
      </div>

      {/* TRANSCRIPTION & LOGS */}
      <div className="w-full max-w-2xl mx-auto glass-panel rounded-[2.5rem] p-8 h-40 overflow-y-auto scrollbar-hide border-white/5 relative mb-32 mx-6">
         <div className="flex flex-col gap-4">
            {transcription.length === 0 && (
                <div className="flex flex-col items-center justify-center opacity-20 py-4">
                   <i className="fa-solid fa-message-dots text-2xl mb-2"></i>
                   <p className="text-[10px] font-bold uppercase tracking-widest">Dostunla dertleşmek için düğmeye bas</p>
                </div>
            )}
            {transcription.map((t, i) => (
                <div key={i} className={`flex gap-4 animate-fade-in ${t.role === 'Nexus' ? 'text-blue-300' : 'text-gray-400'}`}>
                    <span className="text-[10px] font-black uppercase shrink-0 mt-1">[{t.role}]</span>
                    <p className="text-sm leading-relaxed font-medium">{t.text}</p>
                </div>
            ))}
            <div ref={transcriptionEndRef} />
         </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={isActive ? cleanup : startLiveConversation}
            disabled={isConnecting}
            className={`group relative flex items-center gap-5 px-16 py-6 rounded-[3rem] font-black text-xl transition-all shadow-2xl active:scale-95 ${
              isActive 
                ? 'bg-red-500/10 border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' 
                : 'bg-white text-black hover:bg-blue-600 hover:text-white'
            }`}
          >
            {isConnecting ? (
              <><i className="fa-solid fa-atom animate-spin"></i> BAĞLANILIYOR</>
            ) : (
              isActive ? (
                <><i className="fa-solid fa-phone-slash"></i> SOHBETİ KAPAT</>
              ) : (
                <><i className="fa-solid fa-handshake"></i> SOHBETE BAŞLA</>
              )
            )}
            
            {!isActive && !isConnecting && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-4 border-[#050608] animate-ping"></div>
            )}
          </button>
      </div>

      <style>{`
        @keyframes waveform {
          0%, 100% { height: 10%; opacity: 0.3; }
          50% { height: 100%; opacity: 1; }
        }
        .animate-waveform {
          animation: waveform 0.6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConversationView;
