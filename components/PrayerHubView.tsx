
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from '../utils';

interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PrayerHubView: React.FC = () => {
  const [times, setTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const [location, setLocation] = useState<string>("Konum Belirleniyor...");
  const [isAzanEnabled, setIsAzanEnabled] = useState(false);
  const [aiWisdom, setAiWisdom] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);

  const AZAN_URL = "https://www.islamcan.com/audio/azan/azan2.mp3";

  useEffect(() => {
    fetchPrayerTimes();
    generateWisdom();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [times]);

  const fetchPrayerTimes = async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej)
      );
      
      const res = await fetch(`https://api.aladhan.com/v1/timings/${Math.floor(Date.now() / 1000)}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=13`);
      const data = await res.json();
      
      setTimes(data.data.timings);
      setLocation(data.data.meta.timezone);
      setIsLoading(false);
    } catch (err) {
      console.error("Vakitler alınamadı:", err);
      setLocation("İstanbul (Varsayılan)");
      setTimes({
        Fajr: "05:30",
        Sunrise: "07:00",
        Dhuhr: "13:15",
        Asr: "16:45",
        Maghrib: "20:10",
        Isha: "21:45"
      });
      setIsLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!times) return;

    const now = new Date();
    const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const labels: Record<string, string> = { Fajr: "İmsak", Dhuhr: "Öğle", Asr: "İkindi", Maghrib: "Akşam", Isha: "Yatsı" };

    let next = null;

    for (const name of prayerNames) {
      const [h, m] = times[name as keyof PrayerTimes].split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0);

      if (prayerDate > now) {
        const diff = prayerDate.getTime() - now.getTime();
        const hh = Math.floor(diff / (1000 * 60 * 60));
        const mm = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const ss = Math.floor((diff % (1000 * 60)) / 1000);

        if (hh === 0 && mm === 0 && ss === 0 && isAzanEnabled) {
          playAzan();
        }

        next = {
          name: labels[name],
          time: times[name as keyof PrayerTimes],
          countdown: `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
        };
        break;
      }
    }

    if (!next) {
        setNextPrayer({ name: "İmsak (Yarın)", time: times.Fajr, countdown: "--:--:--" });
    } else {
        setNextPrayer(next);
    }
  };

  const generateWisdom = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Bana İslam alimlerinden bir hikmetli söz, bir kısa hadis veya bir dua önerisi ver. Türkçe olsun. Çok kısa olsun (1-2 cümle).",
        config: { temperature: 0.8 }
      });
      setAiWisdom(response.text);
    } catch (e) {
      setAiWisdom("Namaz, müminin miracıdır.");
    }
  };

  const speakWisdom = async () => {
    if (isTtsPlaying || !aiWisdom) return;
    setIsTtsPlaying(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: aiWisdom }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!ttsAudioContextRef.current) {
          ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        const ctx = ttsAudioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsTtsPlaying(false);
        source.start();
      } else {
        setIsTtsPlaying(false);
      }
    } catch (err) {
      console.error("TTS Hatası:", err);
      setIsTtsPlaying(false);
    }
  };

  const playAzan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(AZAN_URL);
    audioRef.current = audio;
    audio.play();
  };

  const stopAzan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in font-sans">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-emerald-900/40 relative animate-pulse">
             <i className="fa-solid fa-kaaba"></i>
             <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full border-4 border-[#0f1115]"></div>
          </div>
          <div>
             <h2 className="text-4xl font-black tracking-tighter text-white">MEGA PRAYER HUB</h2>
             <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-[10px]">{location}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsAzanEnabled(!isAzanEnabled)}
             className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all border ${
               isAzanEnabled ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
             }`}
           >
              <i className={`fa-solid ${isAzanEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
              {isAzanEnabled ? 'Ezan Otomatik' : 'Ezan Kapalı'}
           </button>
           
           <button 
             onClick={playAzan}
             className="bg-amber-500 hover:bg-amber-400 text-black w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform active:scale-95"
           >
              <i className="fa-solid fa-play"></i>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 relative overflow-hidden glass-panel p-10 rounded-[3rem] border-white/5 shadow-2xl bg-gradient-to-br from-emerald-900/20 to-transparent">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="text-center md:text-left">
                 <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Sıradaki Vakit</p>
                 <h3 className="text-6xl font-black text-white mb-2 tracking-tighter">{nextPrayer?.name}</h3>
                 <p className="text-2xl font-bold text-emerald-400 opacity-60 italic">Ezan: {nextPrayer?.time}</p>
              </div>

              <div className="flex flex-col items-center">
                 <div className="w-48 h-48 rounded-full border-8 border-emerald-500/10 flex flex-col items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="absolute inset-0 rounded-full border-t-8 border-emerald-500 animate-[spin_10s_linear_infinite]"></div>
                    <span className="text-4xl font-black font-mono text-white mb-1">{nextPrayer?.countdown}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kalan Süre</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="glass-panel p-8 rounded-[3rem] border-white/5 bg-amber-500/5 flex flex-col justify-center items-center text-center relative group overflow-hidden">
           <div className={`w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black mb-6 shadow-xl transition-all ${isTtsPlaying ? 'animate-bounce scale-110' : ''}`}>
              <i className="fa-solid fa-scroll"></i>
           </div>
           <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Günün Hikmeti</h4>
           <p className="text-lg font-medium text-white/90 leading-relaxed italic mb-6">"{aiWisdom}"</p>
           
           <div className="flex gap-4">
              <button 
                onClick={speakWisdom}
                disabled={isTtsPlaying}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isTtsPlaying ? 'bg-amber-500 text-black' : 'bg-white/5 text-amber-500 hover:bg-amber-500 hover:text-black'}`}
              >
                <i className={`fa-solid ${isTtsPlaying ? 'fa-volume-high animate-pulse' : 'fa-volume-low'}`}></i>
                Sesli Oku
              </button>
              <button 
                onClick={generateWisdom}
                className="bg-white/5 text-gray-500 hover:text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              >
                <i className="fa-solid fa-rotate"></i>
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 pb-20">
        {times && Object.entries(times).filter(([key]) => ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(key)).map(([key, value]) => {
          const labels: Record<string, string> = { Fajr: "İmsak", Sunrise: "Güneş", Dhuhr: "Öğle", Asr: "İkindi", Maghrib: "Akşam", Isha: "Yatsı" };
          const icons: Record<string, string> = { Fajr: "fa-cloud-moon", Sunrise: "fa-sun", Dhuhr: "fa-sun", Asr: "fa-cloud-sun", Maghrib: "fa-moon", Isha: "fa-star-and-crescent" };
          const isActive = nextPrayer?.name === labels[key];

          return (
            <div 
              key={key}
              className={`glass-panel p-6 rounded-[2rem] border-white/5 flex flex-col items-center text-center transition-all ${
                isActive ? 'bg-emerald-600 shadow-emerald-900/40 ring-4 ring-emerald-500/20 scale-105' : 'hover:bg-white/5'
              }`}
            >
              <i className={`fa-solid ${icons[key]} text-2xl mb-4 ${isActive ? 'text-white' : 'text-emerald-500'}`}></i>
              <h4 className={`text-xs font-black uppercase tracking-widest mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`}>{labels[key]}</h4>
              <span className={`text-xl font-black ${isActive ? 'text-white' : 'text-white/80'}`}>{value}</span>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
        <div className="glass-panel p-6 rounded-[2.5rem] border-white/10 shadow-2xl backdrop-blur-3xl flex items-center justify-center gap-10">
           <div className="flex items-center gap-4 text-emerald-500/50">
              <i className="fa-solid fa-circle-info"></i>
              <p className="text-[10px] font-bold uppercase tracking-widest">Ezan sesi vakti gelince otomatik çalar (Tarayıcı izni gereklidir).</p>
           </div>
        </div>
      </div>
      
    </div>
  );
};

export default PrayerHubView;
