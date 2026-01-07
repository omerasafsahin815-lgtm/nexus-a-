
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import ImageView from './components/ImageView';
import VideoView from './components/VideoView';
import LiveView from './components/LiveView';
import GameView from './components/GameView';
import AIBuilderView from './components/AIBuilderView';
import GoogleHubView from './components/GoogleHubView';
import MinecraftView from './components/MinecraftView';
import TeacherView from './components/TeacherView';
import SpaceInvadersView from './components/SpaceInvadersView';
import SurfGameView from './components/SurfGameView';
import MusicView from './components/MusicView';
import CoderView from './components/CoderView';
import ForgeView from './components/ForgeView';
import YouTubeView from './components/YouTubeView';
import VisionView from './components/VisionView';
import ConversationView from './components/ConversationView';
import MarketplaceView from './components/MarketplaceView';
import LegoGameView from './components/LegoGameView';
import PrayerHubView from './components/PrayerHubView';
import TVView from './components/TVView';
import LoginView from './components/LoginView';
import SettingsView from './components/SettingsView';
import { View, User } from './types';

const App: React.FC = () => {
  const [currentView, setView] = useState<View>(View.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [showReward, setShowReward] = useState<{ amount: number; msg: string } | null>(null);
  const [globalStatus, setGlobalStatus] = useState<{ type: 'error' | 'info'; msg: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const handleError = (event: PromiseRejectionEvent) => {
      const isQuota = event.reason?.message?.includes("429") || event.reason?.message?.toLowerCase().includes("quota");
      if (isQuota) {
        setGlobalStatus({ 
          type: 'info', 
          msg: "Nexus Kota Koruması: Sunucu yoğun, otomatik iyileştirme başlatıldı. Lütfen bekleyin..." 
        });
        setTimeout(() => setGlobalStatus(null), 6000);
      } else {
        setGlobalStatus({ 
          type: 'error', 
          msg: "Sistem Hatası: Protokol yeniden başlatılıyor." 
        });
        setTimeout(() => setGlobalStatus(null), 4000);
      }
    };

    window.addEventListener("unhandledrejection", handleError);
    return () => window.removeEventListener("unhandledrejection", handleError);
  }, []);

  const saveUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
  };

  const handleLogin = (newUser: Partial<User>) => {
    const fullUser: User = {
      username: newUser.username || 'Kullanıcı',
      isLoggedIn: true,
      nexusBalance: 1000,
      rank: 'Çaylak',
      settings: {
        accentColor: 'bg-indigo-600',
        aiModel: 'pro',
        thinkingBudget: 8000,
        voiceName: 'Kore'
      }
    };
    saveUser(fullUser);
    setView(View.HOME);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexus_user');
  };

  const earnPoints = useCallback((amount: number, reason: string) => {
    if (!user) return;
    const newBalance = user.nexusBalance + amount;
    let newRank = user.rank;
    if (newBalance > 10000) newRank = 'Mega Elmas';
    else if (newBalance > 5000) newRank = 'Altın Üye';
    else if (newBalance > 2500) newRank = 'Gümüş Üye';

    saveUser({ ...user, nexusBalance: newBalance, rank: newRank });
    setShowReward({ amount, msg: reason });
    setTimeout(() => setShowReward(null), 3000);
  }, [user]);

  const renderView = () => {
    switch (currentView) {
      case View.HOME: return <HomeView username={user?.username || 'Kullanıcı'} setView={setView} nexusBalance={user?.nexusBalance || 0} />;
      case View.CHAT: return <ChatView onEarnPoints={earnPoints} />;
      case View.MARKETPLACE: return <MarketplaceView nexusBalance={user?.nexusBalance || 0} onSpend={(amt) => earnPoints(-amt, 'Eklenti Alındı')} />;
      case View.LEGO: return <LegoGameView onEarnPoints={earnPoints} />;
      case View.CONVERSATION: return <ConversationView onEarnPoints={earnPoints} />;
      case View.YOUTUBE: return <YouTubeView />;
      case View.VISION: return <VisionView />;
      case View.FORGE: return <ForgeView />;
      case View.CODER: return <CoderView />;
      case View.MUSIC: return <MusicView />;
      case View.AI_BUILDER: return <AIBuilderView />;
      case View.GOOGLE_HUB: return <GoogleHubView />;
      case View.MINECRAFT: return <MinecraftView onEarnPoints={earnPoints} />;
      case View.TEACHER: return <TeacherView />;
      case View.SPACE_INVADERS: return <SpaceInvadersView onEarnPoints={earnPoints} />;
      case View.SURF: return <SurfGameView onEarnPoints={earnPoints} />;
      case View.IMAGE: return <ImageView />;
      case View.VIDEO: return <VideoView />;
      case View.LIVE: return <LiveView />;
      case View.GAME: return <GameView />;
      case View.PRAYER_HUB: return <PrayerHubView />;
      case View.TV: return <TVView />;
      case View.SETTINGS: return <SettingsView user={user!} saveUser={saveUser} />;
      default: return <HomeView username={user?.username || 'Kullanıcı'} setView={setView} nexusBalance={user?.nexusBalance || 0} />;
    }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#0f1115] overflow-hidden text-white animate-fade-in relative">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        user={user} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Global Status Notification */}
        {globalStatus && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[200] animate-bounce-in w-full max-w-lg px-6">
             <div className={`${globalStatus.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'} text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-2xl bg-opacity-90`}>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${globalStatus.type === 'error' ? 'fa-triangle-exclamation' : 'fa-bolt-auto'} text-xl animate-pulse`}></i>
                </div>
                <div>
                   <p className="font-black text-[10px] uppercase tracking-widest opacity-60">Sistem Bildirimi</p>
                   <p className="font-bold text-sm leading-tight">{globalStatus.msg}</p>
                </div>
             </div>
          </div>
        )}

        {/* Central HUD / Notification */}
        {showReward && (
          <div className="absolute top-10 right-10 z-[100] animate-bounce-in">
             <div className="bg-amber-500 text-black px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-amber-300">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-amber-500 font-black">N</div>
                <div>
                   <p className="font-black text-xs uppercase tracking-widest">+{showReward.amount} NEXUS</p>
                   <p className="text-[10px] font-bold opacity-70">{showReward.msg}</p>
                </div>
             </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
        <div className="flex-1 relative z-10">
          {renderView()}
        </div>
      </main>

      <style>{`
        @keyframes bounce-in {
          0% { transform: translateY(-50px) scale(0.8); opacity: 0; }
          70% { transform: translateY(10px) scale(1.1); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default App;
