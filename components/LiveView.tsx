
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<{ role: string, text: string }[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  
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

  const startSession = async () => {
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
              if (aiState === 'speaking') return; // Don't send input while AI is speaking (simplified echo cancel)
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
               setTranscription(prev => [...prev, { role: 'AI', text }]);
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
          onclose: () => {
            cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } } },
          systemInstruction: 'Sen Nexus AI adında mega zeki, samimi ve empatik bir asistansın. Kullanıcıyla doğal ve akıcı bir sesli sohbet gerçekleştir. Yanıtlarını sesli konuşmaya uygun şekilde kısa ve öz tut.',
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
    <div className="flex flex-col h-full bg-[#050608] items-center justify-between p-10 overflow-hidden relative">
      {/* Background Ambience */}
      <div className={`absolute inset-0 transition-colors duration-1000 pointer-events-none ${
        aiState === 'listening' ? 'bg-indigo-500/5' : 
        aiState === 'thinking' ? 'bg-amber-500/5' : 
        aiState === 'speaking' ? 'bg-purple-500/5' : 'bg-transparent'
      }`}></div>

      {/* TOP HEADER */}
      <div className="z-10 text-center">
         <h2 className="text-4xl font-black tracking-tighter text-white mb-2">NEXUS AI LIVE</h2>
         <div className="flex items-center justify-center gap-3">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {isActive ? 'GERÇEK ZAMANLI BAĞLANTI AKTİF' : 'BAĞLANTI BEKLENİYOR'}
            </p>
         </div>
      </div>

      {/* CENTER: THE FACE (CORE) */}
      <div className="relative flex flex-col items-center justify-center">
         {/* Circular Glow Layers */}
         <div className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] transition-all duration-1000 ${
           aiState === 'listening' ? 'bg-indigo-500/20 scale-100' :
           aiState === 'thinking' ? 'bg-amber-500/20 scale-110 animate-pulse' :
           aiState === 'speaking' ? 'bg-purple-500/30 scale-125' : 'bg-white/5'
         }`}></div>

         <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Orbiting Rings */}
            <div className={`absolute inset-0 border-2 border-white/5 rounded-full transition-all duration-700 ${aiState !== 'idle' ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]"></div>
            </div>
            <div className={`absolute inset-8 border border-white/10 rounded-full transition-all duration-700 ${aiState !== 'idle' ? 'animate-[spin_6s_linear_infinite_reverse]' : ''}`}>
                <div className="absolute -top-0.5 left-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_15px_#a855f7]"></div>
            </div>

            {/* THE CORE (THE FACE) */}
            <div className={`relative w-48 h-48 rounded-[3rem] glass-panel border-white/10 flex flex-col items-center justify-center gap-8 shadow-2xl transition-all duration-500 ${
                aiState === 'listening' ? 'scale-105 border-indigo-500/40' :
                aiState === 'thinking' ? 'scale-95 rotate-45 border-amber-500/40' :
                aiState === 'speaking' ? 'scale-110 border-purple-500/40' : 'scale-100'
            }`}>
                {/* EYES */}
                <div className="flex gap-14 transition-all duration-500">
                    <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_20px_white] transition-all ${
                        aiState === 'thinking' ? 'animate-bounce h-1' : 
                        aiState === 'listening' ? 'scale-125' : ''
                    }`}></div>
                    <div className={`w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_20px_white] transition-all ${
                        aiState === 'thinking' ? 'animate-bounce h-1 delay-100' : 
                        aiState === 'listening' ? 'scale-125' : ''
                    }`}></div>
                </div>

                {/* MOUTH / WAVEFORM */}
                <div className="flex items-center gap-1.5 h-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div 
                          key={i} 
                          className={`w-1 rounded-full bg-white transition-all duration-150 ${
                            aiState === 'speaking' ? 'animate-waveform' : 
                            aiState === 'listening' ? 'h-1 opacity-40' : 'h-0.5 opacity-20'
                          }`}
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            height: aiState === 'speaking' ? `${Math.random() * 100 + 20}%` : undefined
                          }}
                        ></div>
                    ))}
                </div>
            </div>
         </div>

         {/* STATUS LABEL */}
         <div className="mt-12">
            <p className={`text-xs font-black uppercase tracking-[0.5em] transition-all duration-500 ${
                aiState === 'listening' ? 'text-indigo-400' :
                aiState === 'thinking' ? 'text-amber-500' :
                aiState === 'speaking' ? 'text-purple-400' : 'text-gray-700'
            }`}>
                {aiState === 'listening' ? 'Sizi Dinliyorum' :
                 aiState === 'thinking' ? 'Nexus Düşünüyor' :
                 aiState === 'speaking' ? 'Cevap Veriliyor' : 'Bağlanmak için basın'}
            </p>
         </div>
      </div>

      {/* TRANSCRIPTION BOX */}
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 h-32 overflow-y-auto scrollbar-hide border-white/5 relative mb-24">
         <div className="flex flex-col gap-3">
            {transcription.length === 0 && (
                <p className="text-center text-gray-600 text-xs italic mt-6">Sohbet transkripti burada görünecek...</p>
            )}
            {transcription.map((t, i) => (
                <div key={i} className={`flex gap-3 text-xs animate-fade-in ${t.role === 'AI' ? 'text-purple-400' : 'text-gray-400'}`}>
                    <span className="font-black shrink-0 uppercase tracking-tighter">[{t.role}]:</span>
                    <span className="leading-relaxed">{t.text}</span>
                </div>
            ))}
            <div ref={transcriptionEndRef} />
         </div>
         <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#050608]/40 to-transparent pointer-events-none"></div>
      </div>

      {/* CONTROL BUTTON */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={isActive ? cleanup : startSession}
            disabled={isConnecting}
            className={`group relative flex items-center gap-4 px-12 py-5 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl active:scale-95 ${
              isActive 
                ? 'bg-red-500/10 border-2 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white' 
                : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
            }`}
          >
            {isConnecting ? (
              <><i className="fa-solid fa-circle-notch animate-spin"></i> BAĞLANILIYOR</>
            ) : (
              isActive ? (
                <><i className="fa-solid fa-phone-slash"></i> SOHBETİ BİTİR</>
              ) : (
                <><i className="fa-solid fa-microphone"></i> NEXUS'U UYANDIR</>
              )
            )}
            
            {!isActive && !isConnecting && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#050608] animate-ping"></div>
            )}
          </button>
      </div>

      <style>{`
        @keyframes waveform {
          0%, 100% { height: 10%; }
          50% { height: 100%; }
        }
        .animate-waveform {
          animation: waveform 0.6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LiveView;
