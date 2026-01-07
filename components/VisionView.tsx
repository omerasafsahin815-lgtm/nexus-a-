
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const VisionView: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'describe' | 'ocr' | 'object'>('describe');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Kamera başlatılamadı:", err);
      setAnalysis("Kamera erişimi reddedildi veya cihazınızda kamera bulunamadı.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      let prompt = "Bu resimde ne gördüğünü detaylıca açıkla.";
      if (mode === 'ocr') prompt = "Bu resimdeki tüm metinleri oku ve düzenli bir şekilde listele.";
      if (mode === 'object') prompt = "Bu resimdeki nesneleri tespit et ve konumlarını tarif et.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            { text: prompt }
          ]
        },
        config: {
            systemInstruction: "Sen profesyonel bir görsel analiz uzmanısın. Gördüklerini teknik ama anlaşılır bir dille açıkla."
        }
      });

      setAnalysis(response.text);
    } catch (err) {
      console.error("Analiz hatası:", err);
      setAnalysis("Görsel analiz sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in overflow-hidden max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4">
            <i className="fa-solid fa-eye text-lime-400"></i>
            Vision Lab
          </h2>
          <p className="text-gray-500 font-medium italic">Gemini 3 Visual Intelligence Engine</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setMode('describe')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'describe' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            Tanımla
          </button>
          <button 
            onClick={() => setMode('ocr')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'ocr' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            Metin Oku
          </button>
          <button 
            onClick={() => setMode('object')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'object' ? 'bg-lime-500 text-black shadow-lg shadow-lime-500/20' : 'text-gray-500 hover:text-white'}`}
          >
            Nesne Bul
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
        {/* Camera Feed */}
        <div className="relative glass-panel rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl bg-black group">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
           />
           
           {/* Scanning UI Elements */}
           <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-lime-500/40 shadow-[0_0_20px_#84cc16] animate-scan-y"></div>
              <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-lime-500/50"></div>
              <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-lime-500/50"></div>
              <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-lime-500/50"></div>
              <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-lime-500/50"></div>
              
              {/* HUD Info */}
              <div className="absolute top-10 left-10 flex flex-col gap-1">
                 <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">PROXIMITY: ACTIVE</span>
                 <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">RESOLUTION: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</span>
              </div>
           </div>

           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6">
              <button 
                onClick={analyzeFrame}
                disabled={isLoading}
                className="w-20 h-20 rounded-full bg-lime-500 text-black flex items-center justify-center text-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden group/btn"
              >
                 {isLoading ? (
                    <i className="fa-solid fa-circle-notch animate-spin"></i>
                 ) : (
                    <i className="fa-solid fa-camera"></i>
                 )}
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
              </button>
           </div>
        </div>

        {/* Analysis Result */}
        <div className="flex flex-col h-full gap-6">
           <div className="flex-1 glass-panel rounded-[2.5rem] border-white/10 p-10 overflow-y-auto scrollbar-hide relative">
              {!analysis && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                   <i className="fa-solid fa-magnifying-glass-chart text-8xl mb-6 text-lime-500"></i>
                   <h3 className="text-2xl font-bold">Analize Hazır</h3>
                   <p className="italic">Kamerayı bir nesneye doğrultun ve butona basın.</p>
                </div>
              )}

              {isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 border-4 border-lime-500/20 border-t-lime-500 rounded-full animate-spin mb-6"></div>
                   <h3 className="text-xl font-bold text-lime-400 animate-pulse uppercase tracking-[0.2em]">Piksel Analizi Yapılıyor</h3>
                   <p className="text-gray-500 text-sm mt-2">Gemini görsel verileri yorumluyor...</p>
                </div>
              )}

              {analysis && (
                <div className="animate-fade-in prose prose-invert max-w-none">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-lime-400 flex items-center gap-3 m-0">
                         <i className="fa-solid fa-microchip"></i>
                         Analiz Sonucu
                      </h3>
                      <button 
                        onClick={() => { setAnalysis(null); }}
                        className="text-xs font-bold text-gray-500 hover:text-white"
                      >
                         TEMİZLE
                      </button>
                   </div>
                   <div className="text-gray-200 leading-relaxed text-lg italic whitespace-pre-wrap">
                      {analysis}
                   </div>
                </div>
              )}
           </div>

           <div className="glass-panel p-6 rounded-3xl border-white/5 bg-lime-500/5">
              <h4 className="text-[10px] font-black text-lime-500 uppercase tracking-widest mb-2">Nexus Vision Protocol</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Gemini 3 Flash motoru, gerçek zamanlı görsel işleme ve çok modlu çıkarım yetenekleriyle çevrenizi anlamlandırmanıza yardımcı olur.
              </p>
           </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan-y {
          0% { top: 0% }
          50% { top: 100% }
          100% { top: 0% }
        }
        .animate-scan-y {
          animation: scan-y 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VisionView;
