
import React from 'react';
import { View, User } from '../types';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, user, onLogout }) => {
  const items = [
    { id: View.HOME, icon: 'fa-house', label: 'Ana Sayfa', color: 'bg-slate-700' },
    { id: View.TV, icon: 'fa-tv', label: 'Nexus TV (aTV)', color: 'bg-orange-600' },
    { id: View.PRAYER_HUB, icon: 'fa-kaaba', label: 'Ezan & Namaz', color: 'bg-emerald-700' },
    { id: View.MARKETPLACE, icon: 'fa-store', label: 'Mağaza', color: 'bg-amber-500' },
    { id: View.LEGO, icon: 'fa-shapes', label: 'Lego Builder', color: 'bg-yellow-500' },
    { id: View.CONVERSATION, icon: 'fa-face-smile-wink', label: 'AI Sohbet Modu', color: 'bg-indigo-600' },
    { id: View.VISION, icon: 'fa-eye', label: 'Vision Lab', color: 'bg-lime-500' },
    { id: View.YOUTUBE, icon: 'fa-brands fa-youtube', label: 'YouTube Hub', color: 'bg-red-600' },
    { id: View.FORGE, icon: 'fa-microchip', label: 'Nexus Forge', color: 'bg-orange-500' },
    { id: View.CHAT, icon: 'fa-comments', label: 'Mega Chat', color: 'bg-blue-500' },
    { id: View.CODER, icon: 'fa-code', label: 'DevStudio', color: 'bg-indigo-500' },
    { id: View.MUSIC, icon: 'fa-music', label: 'Music Studio', color: 'bg-rose-500' },
    { id: View.MINECRAFT, icon: 'fa-cubes', label: 'Mega Craft 3D', color: 'bg-emerald-600' },
    { id: View.IMAGE, icon: 'fa-wand-magic-sparkles', label: 'Görüntü Oluştur', color: 'bg-purple-500' },
    { id: View.VIDEO, icon: 'fa-video', label: 'Video (Veo)', color: 'bg-pink-500' },
  ];

  return (
    <div className="w-20 md:w-64 flex flex-col glass-panel h-screen p-4 transition-all duration-300 z-30">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${user?.settings?.accentColor || 'ai-gradient shadow-indigo-500/20'}`}>
          <i className="fa-solid fa-atom text-white text-xl"></i>
        </div>
        <h1 className="hidden md:block font-bold text-xl tracking-tight text-white/90">Nexus AI</h1>
      </div>

      {/* Wallet Display */}
      <div className="hidden md:block px-2 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
           <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nexus Bakiyesi</span>
              <span className="text-[10px] font-black text-amber-500">{user?.rank}</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-black font-black">N</div>
              <span className="text-lg font-black text-white">{user?.nexusBalance?.toLocaleString()}</span>
           </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 scrollbar-hide">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              currentView === item.id ? item.color : 'bg-gray-800 group-hover:bg-gray-700'
            }`}>
              <i className={`fa-solid ${item.icon} text-sm`}></i>
            </div>
            <span className="hidden md:block font-medium text-sm truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-4 border-t border-white/10">
        <button
          onClick={() => setView(View.SETTINGS)}
          className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
            currentView === View.SETTINGS 
              ? 'bg-white/10 text-white' 
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 group-hover:bg-indigo-500/20`}>
            <i className="fa-solid fa-gear text-sm"></i>
          </div>
          <span className="hidden md:block font-medium text-sm">Ayarlar</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 group-hover:bg-red-500/20">
            <i className="fa-solid fa-right-from-bracket text-sm"></i>
          </div>
          <span className="hidden md:block font-medium text-sm">Çıkış</span>
        </button>

        <div className="px-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
               <i className="fa-solid fa-user text-indigo-300 text-xs"></i>
            </div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs font-semibold truncate text-white/90">{user?.username || 'Misafir'}</p>
              <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Premium</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
