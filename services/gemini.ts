
import { GoogleGenAI, Type, Modality } from "@google/genai";

export class GeminiService {
  private ai: any;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private refreshClient() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  // Gelişmiş Yeniden Deneme Mantığı
  private async callWithRetry(fn: () => Promise<any>, retries = 4, delay = 2000): Promise<any> {
    try {
      return await fn();
    } catch (err: any) {
      const isQuotaError = err.message?.includes("429") || err.message?.toLowerCase().includes("quota");
      if (isQuotaError && retries > 0) {
        console.warn(`Nexus Kota Koruması: ${delay}ms bekleniyor...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callWithRetry(fn, retries - 1, delay * 1.5);
      }
      throw err;
    }
  }

  async generateText(prompt: string, history: any[] = []) {
    this.refreshClient();
    
    const execute = async (modelName: string) => {
      return await this.ai.models.generateContent({
        model: modelName,
        contents: [
          ...history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    };

    try {
      // Önce standart Flash modelini dene
      const response = await this.callWithRetry(() => execute('gemini-3-flash-preview'));
      return {
        text: response.text,
        grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
          title: c.web?.title || 'Kaynak',
          uri: c.web?.uri
        })).filter((c: any) => c.uri) || []
      };
    } catch (err) {
      // Kota dolarsa en hafif modele (Flash Lite) düş
      console.warn("Standart model kotası doldu, Lite moduna geçiliyor...");
      const liteResponse = await this.callWithRetry(() => execute('gemini-flash-lite-latest'));
      return {
        text: liteResponse.text,
        grounding: []
      };
    }
  }

  async generateComplexTask(prompt: string, systemInstruction?: string, isJson: boolean = false) {
    this.refreshClient();
    // Model hiyerarşisi: Pro -> Flash -> Flash Lite
    const modelPriority = ['gemini-3-pro-preview', 'gemini-3-flash-preview', 'gemini-flash-lite-latest'];
    
    for (const modelName of modelPriority) {
      try {
        const response = await this.callWithRetry(async () => {
          return await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: isJson ? "application/json" : undefined,
              thinkingConfig: modelName.includes('pro') ? { thinkingBudget: 4000 } : undefined
            }
          });
        }, 1, 1000);
        return response;
      } catch (err: any) {
        if (modelName === modelPriority[modelPriority.length - 1]) throw err;
        console.warn(`Nexus: ${modelName} kotası doldu, yedek kanala geçiliyor...`);
      }
    }
  }

  async generateImage(prompt: string, aspectRatio: string = "1:1") {
    this.refreshClient();
    return await this.callWithRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("Resim oluşturulamadı.");
    });
  }

  async generateVideo(prompt: string) {
    this.refreshClient();
    let operation = await this.ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await this.ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async generateSpeech(text: string, voice: string = 'Kore') {
    this.refreshClient();
    const response = await this.callWithRetry(() => this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    }));

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
}

export const gemini = new GeminiService();
