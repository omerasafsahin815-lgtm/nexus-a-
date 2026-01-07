
import React, { useState } from 'react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (mode === 'register' && !email.trim()) return;

    setIsLoading(true);
    // Simüle edilmiş süreç
    setTimeout(() => {
      onLogin({ username, isLoggedIn: true });
      setIsLoading(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050608] overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      
      <div className="relative w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 ai-gradient rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <i className="fa-solid fa-atom text-white text-4xl"></i>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">NEXUS AI</h1>
          <p className="text-gray-500 font-medium italic">Sınırları Zorlayan Yapay Zeka Deneyimi</p>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Hesap Oluştur
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">E-Posta Adresi</label>
                <div className="relative group">
                  <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-indigo-400 transition-colors"></i>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@nexus.ai"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">Kullanıcı Adı</label>
              <div className="relative group">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-indigo-400 transition-colors"></i>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mega_kullanici"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">Şifre</label>
              <div className="relative group">
                <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-indigo-400 transition-colors"></i>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full ai-gradient text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  {mode === 'login' ? 'Giriş Yapılıyor...' : 'Profil Oluşturuluyor...'}
                </>
              ) : (
                <>
                  <i className={`fa-solid ${mode === 'login' ? 'fa-right-to-bracket' : 'fa-user-plus'}`}></i>
                  {mode === 'login' ? 'Sisteme Giriş' : 'Hemen Katıl'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500">
              {mode === 'login' ? "Hesabınız yok mu?" : "Zaten üye misiniz?"}
              <span 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-indigo-400 font-bold ml-2 cursor-pointer hover:underline decoration-2 underline-offset-4"
              >
                {mode === 'login' ? 'Hesap Oluştur' : 'Giriş Yap'}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            <i className="fa-brands fa-google text-xl"></i>
            <i className="fa-brands fa-apple text-xl"></i>
            <i className="fa-brands fa-microsoft text-xl"></i>
        </div>

        <p className="mt-8 text-center text-[9px] text-gray-600 uppercase tracking-widest font-black">
          Nexus Mega Intelligence Protocol v4.0.2
        </p>
      </div>
    </div>
  );
};

export default LoginView;
