
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface LessonContent {
  plan: string;
  explanation: string;
  quiz: { question: string; options: string[]; answer: number }[];
}

const TeacherView: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('High School');
  const [content, setContent] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'explain' | 'quiz'>('plan');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const generateLesson = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setContent(null);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const prompt = `Act as a world-class pedagogue. The user wants to learn about "${topic}" at a ${level} level. 
      1. Provide a detailed Lesson Plan (objectives, duration, core concepts).
      2. Provide a simple and engaging Explanation of the topic.
      3. Create 3 multiple choice questions based on the topic.
      Return the result in JSON format with keys: 'plan', 'explanation', and 'quiz' (array of objects with 'question', 'options', 'answer' as index 0-3).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plan: { type: Type.STRING },
              explanation: { type: Type.STRING },
              quiz: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.INTEGER }
                  },
                  required: ["question", "options", "answer"]
                }
              }
            },
            required: ["plan", "explanation", "quiz"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setContent(data);
    } catch (err) {
      console.error(err);
      alert("Ders materyalleri oluşturulurken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto w-full h-full overflow-y-auto scrollbar-hide">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-4">
            <i className="fa-solid fa-chalkboard-user text-amber-500"></i>
            Mega Öğretmen Modu
          </h2>
          <p className="text-gray-400 font-medium">Kişiselleştirilmiş eğitim materyalleri ve interaktif öğrenme.</p>
        </div>
        <div className="flex gap-2">
            {['Primary', 'High School', 'University'].map(l => (
                <button 
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${level === l ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    {l === 'Primary' ? 'İlkokul' : l === 'High School' ? 'Lise' : 'Üniversite'}
                </button>
            ))}
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[2.5rem] border-white/10 shadow-2xl mb-10">
        <div className="relative group">
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateLesson()}
            placeholder="Hangi konuyu öğrenmek veya öğretmek istiyorsun? (Örn: Fotosentez, Newton Kanunları...)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 focus:outline-none focus:border-amber-500 transition-all text-lg"
          />
          <button 
            onClick={generateLesson}
            disabled={!topic.trim() || isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
          </button>
        </div>
      </div>

      {isLoading && !content && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center text-4xl text-amber-500 mb-6">
                <i className="fa-solid fa-brain animate-bounce"></i>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Pedagojik Analiz Yapılıyor...</p>
        </div>
      )}

      {content && (
        <div className="animate-fade-in">
          <div className="flex gap-4 mb-8">
            {[
              { id: 'plan', label: 'Ders Planı', icon: 'fa-scroll' },
              { id: 'explain', label: 'Konu Anlatımı', icon: 'fa-book-open' },
              { id: 'quiz', label: 'Hızlı Sınav', icon: 'fa-list-check' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-amber-500 text-white shadow-xl' : 'glass-panel text-gray-500 hover:text-white'}`}
              >
                <i className={`fa-solid ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="glass-panel p-10 rounded-[2.5rem] border-white/10 min-h-[400px]">
            {activeTab === 'plan' && (
              <div className="animate-fade-in prose prose-invert max-w-none">
                <h3 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-3">
                    <i className="fa-solid fa-map"></i> Müfredat Akışı
                </h3>
                <div className="whitespace-pre-wrap leading-relaxed text-gray-300 text-lg">
                  {content.plan}
                </div>
              </div>
            )}

            {activeTab === 'explain' && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-amber-500 flex items-center gap-3">
                        <i className="fa-solid fa-lightbulb"></i> Basitleştirilmiş Anlatım
                    </h3>
                    <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">Pedagojik Filtre Aktif</span>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/5 italic text-xl leading-relaxed text-gray-200 shadow-inner">
                   {content.explanation}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="animate-fade-in space-y-10">
                <h3 className="text-2xl font-bold text-amber-500 flex items-center gap-3">
                    <i className="fa-solid fa-check-double"></i> Bilgi Kontrolü
                </h3>
                {content.quiz.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-4">
                    <p className="font-bold text-lg flex gap-3">
                        <span className="text-amber-500">Soru {qIdx + 1}:</span> {q.question}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            quizSubmitted 
                              ? oIdx === q.answer 
                                ? 'bg-green-500/20 border-green-500 text-green-400' 
                                : quizAnswers[qIdx] === oIdx 
                                  ? 'bg-red-500/20 border-red-500 text-red-400' 
                                  : 'bg-white/5 border-white/5 opacity-50'
                              : quizAnswers[qIdx] === oIdx 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-900/20' 
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-black mr-3 opacity-40">{['A','B','C','D'][oIdx]})</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {!quizSubmitted ? (
                    <button 
                        onClick={() => setQuizSubmitted(true)}
                        className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-amber-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Sınavı Bitir ve Sonuçları Gör
                    </button>
                ) : (
                    <div className="bg-white/5 p-6 rounded-2xl flex items-center justify-between border border-white/5 animate-bounce-in">
                        <div className="flex items-center gap-4">
                            <i className="fa-solid fa-star text-amber-500 text-2xl"></i>
                            <span className="font-bold">Öğrenme yolculuğunda harika bir adım attın!</span>
                        </div>
                        <button 
                            onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                            className="text-amber-500 font-bold hover:underline"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherView;
