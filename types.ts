
export enum View {
  HOME = 'home',
  CHAT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  SPEECH = 'speech',
  LIVE = 'live',
  GAME = 'game',
  AI_BUILDER = 'ai_builder',
  GOOGLE_HUB = 'google_hub',
  MINECRAFT = 'minecraft',
  TEACHER = 'teacher',
  SPACE_INVADERS = 'space_invaders',
  SURF = 'surf',
  MUSIC = 'music',
  CODER = 'coder',
  FORGE = 'forge',
  YOUTUBE = 'youtube',
  VISION = 'vision',
  CONVERSATION = 'conversation',
  MARKETPLACE = 'marketplace',
  LEGO = 'lego',
  PRAYER_HUB = 'prayer_hub',
  SETTINGS = 'settings',
  TV = 'tv'
}

export interface User {
  username: string;
  isLoggedIn: boolean;
  avatar?: string;
  nexusBalance: number;
  rank: string;
  settings?: {
    accentColor: string;
    aiModel: 'pro' | 'flash';
    thinkingBudget: number;
    voiceName: string;
  };
}

export interface Extension {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNum: number;
  icon: string;
  color: string;
  category: 'AI' | 'Media' | 'Gaming' | 'Tools';
  isInstalled: boolean;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  images?: string[];
  groundingLinks?: { title: string; uri: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface CustomAI {
  id: string;
  name: string;
  instruction: string;
  icon: string;
  color: string;
  useSearch: boolean;
}
