import React, { useState } from 'react';
import { 
  CreditCard,
  FileText, 
  MessageSquare, 
  Clock, 
  Settings,
  Bell,
  LogOut,
  User,
  ArrowRight,
  ShieldAlert,
  Menu,
  X,
  AlertOctagon,
  CheckCircle,
  LayoutDashboard
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for conditional classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { title: 'Ocorrências Abertas', value: '12', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50' },
    { title: 'Em Análise', value: '5', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Resolvidas', value: '28', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  const recentActivities = [
    { 
      id: 1, 
      title: 'Vazamento no Bloco A, 3º andar',
      type: 'Ocorrência',
      time: '2h atrás',
      status: 'Aberto',
      statusColor: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    { 
      id: 2, 
      title: 'Barulho excessivo - Unidade 204',
      type: 'Reclamação',
      time: '4h atrás',
      status: 'Em Análise',
      statusColor: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    { 
      id: 3, 
      title: 'Elevador com defeito - Bloco B',
      type: 'Ocorrência',
      time: '1d atrás',
      status: 'Resolvida',
      statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-800/50">
          <span className="text-4xl leading-none font-black text-orange-500 tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif", textShadow: "0 0 10px rgba(234, 88, 12, 0.8), 0 0 20px rgba(234, 88, 12, 0.5)" }}>
            PM
          </span>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-tight">Portal do</h1>
            <p className="text-orange-500 text-sm font-bold tracking-widest uppercase" style={{ textShadow: "0 0 10px rgba(234, 88, 12, 0.6)" }}>Morador</p>
          </div>
          <button 
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          
          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Navegação</p>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 bg-blue-600/10 text-blue-400 rounded-lg group transition-all">
                <LayoutDashboard className="w-5 h-5 group-hover:text-blue-300 transition-colors" />
                <span className="font-medium">Dashboard</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
                <ShieldAlert className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                <span className="font-medium">Registrar Ocorrência</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
                <AlertOctagon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                <span className="font-medium">Registrar Reclamação</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
                <Bell className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                <span className="font-medium">Feed de Ocorrências</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
                <FileText className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                <span className="font-medium">Minhas Solicitações</span>
              </a>
            </nav>
          </div>

          <div>
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Administração</p>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
                <Settings className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                <span className="font-medium">Painel do Síndico</span>
              </a>
            </nav>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 hover:bg-slate-900 rounded-lg group transition-all hover:text-white">
            <User className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            <span className="font-medium text-sm">Perfil</span>
          </a>
          <a href="/login" className="flex items-center gap-3 px-3 py-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 rounded-lg group transition-all">
            <LogOut className="w-5 h-5 transition-colors" />
            <span className="font-medium text-sm">Sair</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
              <p className="text-sm text-slate-500">Bem-vindo de volta, Morador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-rose-400 border-2 border-white shadow-sm ring-2 ring-slate-100 cursor-pointer"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</div>
                      <div className="text-sm font-medium text-slate-500">{stat.title}</div>
                    </div>
                    <div className={cn("p-3 rounded-xl", stat.bg)}>
                      <stat.icon className={cn("w-6 h-6", stat.color)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a href="#" className="group flex items-center justify-between bg-white border border-slate-200 hover:border-orange-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Registrar Ocorrência</h3>
                    <p className="text-sm text-slate-500 mt-1">Abrir uma Nova Ocorrência</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-orange-50 flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </a>

              <a href="#" className="group flex items-center justify-between bg-white border border-slate-200 hover:border-amber-500 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Registrar Reclamação</h3>
                    <p className="text-sm text-slate-500 mt-1">Reportar uma Reclamação ou Violação</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-amber-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </a>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Atividades Recentes</h3>
                <a href="#" className="text-sm font-medium text-orange-600 flex items-center gap-1 hover:text-orange-700 hover:underline">
                  Ver tudo <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="divide-y divide-slate-100">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-50 group-hover:ring-orange-100 transition-all"></div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">{activity.title}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-500">
                          <span className="font-medium text-slate-600">{activity.type}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border sm:self-center self-start whitespace-nowrap",
                      activity.statusColor
                    )}>
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
