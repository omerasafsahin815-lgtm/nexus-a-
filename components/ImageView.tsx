
import React, { useState } from 'react';
import { gemini } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const url = await gemini.generateImage(prompt, aspectRatio);
      const newImg: GeneratedImage = {
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date()
      };
      setImages([newImg, ...images]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert('Görüntü oluşturulamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-6xl mx-auto w-full">
      <div className="glass-panel p-8 rounded-3xl mb-10 border-white/5 shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <i className="fa-solid fa-wand-magic-sparkles text-purple-400"></i>
          Mega Görsel Oluşturucu
        </h2>
        <p className="text-gray-400 mb-8">Gemini 2.5 Flash Image motoruyla saniyeler içinde büyüleyici görseller tasarlayın.</p>

        <div className="space-y-6">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Neyi hayal ediyorsun? (Örn: Cyberpunk bir İstanbul sokak manzarası, yağmurlu, neon ışıklar...)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[120px] focus:outline-none focus:border-purple-500 transition-all text-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-xl border border-white/10">
              {['1:1', '16:9', '9:16', '3:4', '4:3'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="ml-auto bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-purple-900/20"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Hayal Ediliyor...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-sparkles"></i>
                  Oluştur
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map(img => (
          <div key={img.id} className="group glass-panel rounded-2xl overflow-hidden border-white/5 hover:border-purple-500/50 transition-all hover:translate-y-[-4px]">
            <div className="relative aspect-square overflow-hidden bg-black/20">
              <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <a href={img.url} download={`nexus-ai-${img.id}.png`} className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                   <i className="fa-solid fa-download"></i>
                </a>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm line-clamp-2 text-gray-300 font-medium">{img.prompt}</p>
              <div className="flex justify-between items-center mt-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <span>{img.timestamp.toLocaleDateString()}</span>
                <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">Mega Flash</span>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center opacity-30 select-none">
            <i className="fa-solid fa-image text-8xl mb-4 block"></i>
            <p className="text-xl">Henüz bir şey oluşturmadınız</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageView;
