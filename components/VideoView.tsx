
import React, { useState, useEffect } from 'react';
import { gemini } from '../services/gemini';
import { GeneratedVideo } from '../types';

const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasKey(!!selected);
    };
    checkKey();
  }, []);

  const handleKeySelect = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasKey(true); // Proceed as per instructions
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const url = await gemini.generateVideo(prompt);
      const newVid: GeneratedVideo = {
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date()
      };
      setVideos([newVid, ...videos]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      if (err.toString().includes("Requested entity was not found")) {
        setHasKey(false);
        alert("Lütfen API anahtarınızı tekrar seçin.");
      } else {
        alert('Video oluşturulamadı. Bu işlem birkaç dakika sürebilir.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 bg-pink-500/20 rounded-3xl flex items-center justify-center mb-6 text-pink-500 text-4xl">
           <i className="fa-solid fa-key"></i>
        </div>
        <h2 className="text-3xl font-bold mb-4">API Anahtarı Gerekli</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Veo video oluşturma modelini kullanmak için kendi ücretli projenizden bir API anahtarı seçmelisiniz.
          <br /><br />
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-pink-400 hover:underline">Ücretlendirme hakkında bilgi edinin</a>
        </p>
        <button
          onClick={handleKeySelect}
          className="bg-pink-600 hover:bg-pink-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95"
        >
          API Anahtarı Seç
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
      <div className="glass-panel p-8 rounded-3xl mb-10 border-white/5 shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <i className="fa-solid fa-film text-pink-400"></i>
          Veo Mega Video Studio
        </h2>
        <p className="text-gray-400 mb-8">Dünyanın en gelişmiş video üretim modeli Veo 3.1 ile sinematik içerikler üretin.</p>

        <div className="space-y-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Aksiyonu tarif et... (Örn: Gece vakti Tokyo sokaklarında hızla giden neon ışıklı bir araba, düşük kamera açısı, 4k sinematik)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:border-pink-500 transition-all text-lg"
          />

          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 text-xs text-gray-500">
                <i className="fa-solid fa-circle-info text-pink-400"></i>
                Video oluşturma 1-3 dakika sürebilir.
             </div>
             <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl transition-all"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-shuttle-space animate-bounce"></i>
                  Video Render Ediliyor...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-clapperboard"></i>
                  Video Üret
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {videos.map(vid => (
          <div key={vid.id} className="glass-panel rounded-3xl overflow-hidden border-white/5 shadow-2xl">
            <video src={vid.url} controls className="w-full aspect-video bg-black" />
            <div className="p-6">
              <p className="text-white/80 font-medium mb-4">{vid.prompt}</p>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{vid.timestamp.toLocaleString()}</span>
                 <a href={vid.url} download className="text-pink-400 text-sm hover:underline font-bold">İndir (MP4)</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-10 flex flex-col items-center gap-4 py-20 bg-white/5 rounded-3xl border border-dashed border-pink-500/30">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            <i className="fa-solid fa-rocket absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-500 text-xl"></i>
          </div>
          <p className="text-lg font-bold">Sinematik Motor Başlatıldı</p>
          <div className="flex flex-col items-center text-sm text-gray-500 space-y-1">
             <span>Piksel verileri optimize ediliyor...</span>
             <span>Veo 3.1 kareleri işliyor...</span>
             <span>Neredeyse hazır!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoView;
