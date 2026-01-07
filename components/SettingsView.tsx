
import React, { useState } from 'react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  saveUser: (user: User) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, saveUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'interface' | 'system'>('profile');
  const [username, setUsername] = useState(user.username);
  
  const updateSettings = (key: string, value: any) => {
    const updatedUser = {
      ...user,
      settings: {
        ...(user.settings || {
            accentColor: 'bg-indigo-600',
            aiModel: 'pro',
            thinkingBudget: 8000,
            voiceName: 'Kore'
        }),
        [key]: value
      }
    };
    saveUser(updatedUser);
  };

  const handleUsernameChange = () => {
    if (!username.trim()) return;
    saveUser({ ...user, username });
    alert("Kullanıcı adı güncellendi!");
  };

  const colors = [
    { name: 'Nexus İndigo', value: 'bg-indigo-600' },
    { name: 'Kuantum Mor', value: 'bg-purple-600' },
    { name: 'Asit Yeşil', value: 'bg-lime-500' },
    { name: 'Güneş Turuncusu', value: 'bg-amber-500' },
    { name: 'Ateş Kırmızısı', value: 'bg-red-600' },
    { name: 'Okyanus Mavisi', value: 'bg-blue-500' },
  ];

  return (
    <div className="p-10 max-w-5xl mx-auto w-full h-full overflow-y-auto scrollbar-hide animate-fade-in">
      <div className="mb-10">
        <h2 className="text-4xl font-black mb-2 tracking-tighter">KONTROL MERKEZİ</h2>
        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">Nexus AI v4.0.2 • Ayarlar & Yapılandırma</p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar Tabs */}
        <div className="w-56 space-y-2 shrink-0">
          {[
            { id: 'profile', label: 'Profilim', icon: 'fa-user' },
            { id: 'ai', label: 'AI Çekirdeği', icon: 'fa-brain' },
            { id: 'interface', label: 'Arayüz', icon: 'fa-palette' },
            { id: 'system', label: 'Sistem', icon: 'fa-microchip' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-5`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-panel p-10 rounded-[3rem] border-white/5 min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="animate-fade-in space-y-10">
               <div>
                  <h3 className="text-xl font-bold mb-6">Hesap Kimliği</h3>
                  <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                     <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-3xl text-indigo-400">
                        <i className="fa-solid fa-user-astronaut"></i>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Mevcut Rütbe</p>
                        <p className="text-2xl font-black text-white">{user.rank}</p>
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-3 px-1">Kullanıcı Adı</label>
                  <div className="flex gap-4">
                     <input 
                       type="text" 
                       value={username}
                       onChange={e => setUsername(e.target.value)}
                       className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all text-white"
                     />
                     <button 
                       onClick={handleUsernameChange}
                       className="bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95"
                     >
                        Güncelle
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-fade-in space-y-10">
               <div>
                  <h3 className="text-xl font-bold mb-6">Zeka Motoru</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => updateSettings('aiModel', 'pro')}
                       className={`p-6 rounded-3xl border transition-all text-left ${user.settings?.aiModel === 'pro' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                     >
                        <i className="fa-solid fa-bolt-lightning text-xl mb-4 text-indigo-400"></i>
                        <h4 className="font-bold">Gemini Pro</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed mt-2 uppercase font-black">Derin akıl yürütme, karmaşık görevler ve 32K düşünme bütçesi.</p>
                     </button>
                     <button 
                       onClick={() => updateSettings('aiModel', 'flash')}
                       className={`p-6 rounded-3xl border transition-all text-left ${user.settings?.aiModel === 'flash' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                     >
                        <i className="fa-solid fa-wind text-xl mb-4 text-emerald-400"></i>
                        <h4 className="font-bold">Gemini Flash</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed mt-2 uppercase font-black">Ultra hızlı yanıtlar, yüksek kota ve verimli işlem gücü.</p>
                     </button>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-4 px-1">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Düşünme Bütçesi (Tokens)</label>
                     <span className="text-indigo-400 font-black text-xs">{user.settings?.thinkingBudget} T</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="32000" 
                    step="1000"
                    value={user.settings?.thinkingBudget}
                    onChange={e => updateSettings('thinkingBudget', parseInt(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <p className="text-[9px] text-gray-600 mt-3 font-bold uppercase italic">Daha yüksek bütçe, daha akıllı ama daha yavaş yanıtlar demektir.</p>
               </div>
            </div>
          )}

          {activeTab === 'interface' && (
            <div className="animate-fade-in space-y-10">
               <div>
                  <h3 className="text-xl font-bold mb-6">Görsel Tema</h3>
                  <p className="text-xs text-gray-500 mb-6 font-medium">Uygulamanın vurgu rengini kişiliğine göre ayarla.</p>
                  <div className="grid grid-cols-3 gap-4">
                     {colors.map(color => (
                        <button 
                          key={color.value}
                          onClick={() => updateSettings('accentColor', color.value)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${user.settings?.accentColor === color.value ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                        >
                           <div className={`w-8 h-8 rounded-lg ${color.value} shadow-lg`}></div>
                           <span className="text-xs font-bold">{color.name}</span>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between">
                  <div>
                     <h4 className="font-bold">Neo-Glow Efektleri</h4>
                     <p className="text-[10px] text-gray-500 uppercase font-black mt-1">Animasyonlar ve ışıklandırmaları aktifleştir.</p>
                  </div>
                  <div className="w-14 h-8 bg-indigo-600 rounded-full flex items-center px-1 shadow-inner cursor-pointer">
                     <div className="w-6 h-6 bg-white rounded-full ml-auto shadow-md"></div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-fade-in space-y-6">
               <h3 className="text-xl font-bold mb-6">Sistem Bakımı</h3>
               
               <div className="space-y-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-sm">Yerel Verileri Temizle</h4>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">Tüm geçmişi ve cüzdan bilgilerini sıfırlar.</p>
                     </div>
                     <button className="px-6 py-2 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white rounded-xl font-black text-[10px] uppercase transition-all">Sıfırla</button>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                     <div>
                        <h4 className="font-bold text-sm">API Durumu</h4>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">Google Cloud Proje Bağlantısı</p>
                     </div>
                     <span className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        Aktif
                     </span>
                  </div>
               </div>

               <div className="mt-10 pt-10 border-t border-white/5 text-center">
                  <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Nexus Mega Suite v4.0.2 Stable Build</p>
                  <p className="text-[9px] text-gray-800 mt-2">© 2025 Nexus AI Labs. Tüm hakları saklıdır.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
