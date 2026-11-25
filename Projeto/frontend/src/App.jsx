import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PrimeiroAcesso = lazy(() => import('./pages/PrimeiroAcesso'));
const Ocorrencia = lazy(() => import('./pages/Ocorrencia'));
const Reclamacao = lazy(() => import('./pages/Reclamacao'));
const FeedOcorrencias = lazy(() => import('./pages/FeedOcorrencias'));
const MinhasSolicitacoes = lazy(() => import('./pages/MinhasSolicitacoes'));
const PainelSindico = lazy(() => import('./pages/PainelSindico'));
const PainelFuncionario = lazy(() => import('./pages/PainelFuncionario'));
const PainelMaster = lazy(() => import('./pages/PainelMaster'));
const NovoCondominio = lazy(() => import('./pages/NovoCondominio'));
const CadastroMorador = lazy(() => import('./pages/CadastroMorador'));
const Perfil = lazy(() => import('./pages/Perfil'));
const OcorrenciasConcluidas = lazy(() => import('./pages/OcorrenciasConcluidas'));
const OcorrenciasGestao = lazy(() => import('./pages/OcorrenciasGestao'));
const ReclamacoesSindico = lazy(() => import('./pages/ReclamacoesSindico'));
const MuralAvisos = lazy(() => import('./pages/MuralAvisos'));
const PainelDev = lazy(() => import('./pages/PainelDev'));
const ExclusoesConta = lazy(() => import('./pages/ExclusoesConta'));
const GestaoFuncionarios = lazy(() => import('./pages/GestaoFuncionarios'));
const Recados = lazy(() => import('./pages/Recados'));
const BlocosCondominio = lazy(() => import('./pages/BlocosCondominio'));
const DependenciasCondominio = lazy(() => import('./pages/DependenciasCondominio'));
const Reservas = lazy(() => import('./pages/Reservas'));
const Encomendas = lazy(() => import('./pages/Encomendas'));
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import VisualizadorImagemProvider from './components/VisualizadorImagem';
import NotificacoesPush from './components/NotificacoesPush';

function App() {
  return (
    <AuthProvider>
      <VisualizadorImagemProvider>
      <BrowserRouter>
        <NotificacoesPush />
        <Suspense fallback={<div className="tela-carregando" role="status" aria-label="Carregando" />}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroMorador />} />
          <Route path="/novo-condominio" element={<NovoCondominio />} />
          
          {/* Rotas de Morador (SINDICO e MASTER herdam) */}
          {/* Visão Geral com métricas: só do síndico (o morador começa nos Avisos) */}
          <Route element={<ProtectedRoute allowedRoles={['SINDICO', 'MASTER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO', 'MASTER']} />}>
            <Route path="/ocorrencia" element={<Ocorrencia />} />
            <Route path="/reclamacao" element={<Reclamacao />} />
            <Route path="/feed" element={<FeedOcorrencias />} />
            <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
          </Route>

          {/* Encomendas: o morador (e o síndico, que também mora) vê as do apartamento; o livro é da portaria e da gestão */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO']} />}>
            <Route path="/minhas-encomendas" element={<Encomendas key="minhas" modo="minhas" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['FUNCIONARIO', 'SINDICO', 'MASTER']} />}>
            <Route path="/encomendas" element={<Encomendas key="livro" modo="livro" />} />
          </Route>

          {/* Reservas de dependências: morador e síndico */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO']} />}>
            <Route path="/reservas" element={<Reservas />} />
          </Route>
          
          {/* Painel de Manutenção/Funcionário */}
          <Route element={<ProtectedRoute allowedRoles={['FUNCIONARIO', 'MASTER']} />}>
             <Route path="/painel-funcionario" element={<PainelFuncionario />} />
          </Route>
          
          {/* Painel do Síndico */}
          <Route element={<ProtectedRoute allowedRoles={['SINDICO', 'MASTER']} />}>
            <Route path="/painel" element={<PainelSindico />} />
            <Route path="/ocorrencias-concluidas" element={<OcorrenciasConcluidas />} />
            <Route path="/ocorrencias-analise" element={<OcorrenciasGestao key="analise" modo="analise" />} />
            <Route path="/ocorrencias-pessoais" element={<OcorrenciasGestao key="pessoais" modo="pessoais" />} />
            <Route path="/abertas-prolongadas" element={<OcorrenciasGestao key="abertas" modo="abertas" />} />
            <Route path="/andamento-prolongado" element={<OcorrenciasGestao key="prolongadas" modo="prolongadas" />} />
            <Route path="/funcionarios" element={<GestaoFuncionarios />} />
          </Route>

          {/* Reclamações: só o síndico vê e responde */}
          <Route element={<ProtectedRoute allowedRoles={['SINDICO']} />}>
            <Route path="/reclamacoes" element={<ReclamacoesSindico />} />
          </Route>

          {/* Recados: a gestão envia, os funcionários respondem */}
          <Route element={<ProtectedRoute allowedRoles={['SINDICO', 'MASTER', 'FUNCIONARIO']} />}>
            <Route path="/recados" element={<Recados />} />
          </Route>
          
          {/* Painel de Governança Global (Master) */}
          <Route element={<ProtectedRoute allowedRoles={['MASTER']} />}>
            <Route path="/painel-master" element={<PainelMaster />} />
            <Route path="/blocos" element={<BlocosCondominio />} />
            <Route path="/dependencias" element={<DependenciasCondominio />} />
          </Route>
          
          {/* Equipe Habitare: aprovação de condomínios */}
          <Route element={<ProtectedRoute allowedRoles={['DEV']} />}>
            <Route path="/painel-dev" element={<PainelDev />} />
            <Route path="/exclusoes-conta" element={<ExclusoesConta />} />
          </Route>

          {/* Rota Comum a todos os logados */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO', 'FUNCIONARIO', 'MASTER']} />}>
             <Route path="/perfil" element={<Perfil />} />
             <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
             <Route path="/avisos" element={<MuralAvisos />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </VisualizadorImagemProvider>
    </AuthProvider>
  );
}

export default App;
