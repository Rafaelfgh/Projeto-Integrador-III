import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Building } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen min-h-screen">
      {/* Left Column (Logo Area) */}
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="relative flex flex-col items-center justify-center">
          <span className="text-[140px] leading-none mb-4 font-black text-orange-500 tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif", textShadow: "0 0 30px rgba(234, 88, 12, 0.8), 0 0 60px rgba(234, 88, 12, 0.5), 0 0 100px rgba(234, 88, 12, 0.2)" }}>
            PM
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-widest text-slate-100 uppercase text-center" style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.3)" }}>
            Portal do Morador
          </h2>
        </div>
      </div>

      {/* Right Column (Form Area) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Bem-vindo</h1>
            <p className="text-slate-500">Entre para acessar seu painel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="email">
                E-mail
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-slate-900 bg-slate-50 focus:bg-white"
                  required
                />
                <Mail className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="password">
                Senha
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-slate-900 bg-slate-50 focus:bg-white"
                  required
                />
                <Lock className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              </div>
              <div className="flex justify-end pt-1">
                <a href="#" className="text-sm text-orange-600 hover:text-orange-500 hover:underline transition-all">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.98]"
            >
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Não tem uma conta?{' '}
            <a href="#" className="font-medium text-orange-600 hover:text-orange-500 hover:underline transition-all">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
