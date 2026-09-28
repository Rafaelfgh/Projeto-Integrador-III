import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PrimeiroAcesso from './pages/PrimeiroAcesso';
import CadastroAdmin from './pages/CadastroAdmin';
import Ocorrencia from './pages/Ocorrencia';
import Reclamacao from './pages/Reclamacao';
import FeedOcorrencias from './pages/FeedOcorrencias';
import MinhasSolicitacoes from './pages/MinhasSolicitacoes';
import PainelSindico from './pages/PainelSindico';
import PainelFuncionario from './pages/PainelFuncionario';
import PainelMaster from './pages/PainelMaster';
import NovoCondominio from './pages/NovoCondominio';
import CadastroMorador from './pages/CadastroMorador';
import Perfil from './pages/Perfil';
import OcorrenciasConcluidas from './pages/OcorrenciasConcluidas';
import OcorrenciasGestao from './pages/OcorrenciasGestao';
import MuralAvisos from './pages/MuralAvisos';
import PainelDev from './pages/PainelDev';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import VisualizadorImagemProvider from './components/VisualizadorImagem';

function App() {
  return (
    <AuthProvider>
      <VisualizadorImagemProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<CadastroMorador />} />
          <Route path="/cadastro-admin" element={<CadastroAdmin />} />
          <Route path="/novo-condominio" element={<NovoCondominio />} />
          
          {/* Rotas de Morador (SINDICO e MASTER herdam) */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO', 'MASTER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ocorrencia" element={<Ocorrencia />} />
            <Route path="/reclamacao" element={<Reclamacao />} />
            <Route path="/feed" element={<FeedOcorrencias />} />
            <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
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
            <Route path="/andamento-prolongado" element={<OcorrenciasGestao key="prolongadas" modo="prolongadas" />} />
          </Route>
          
          {/* Painel de Governança Global (Master) */}
          <Route element={<ProtectedRoute allowedRoles={['MASTER']} />}>
            <Route path="/painel-master" element={<PainelMaster />} />
          </Route>
          
          {/* Equipe Habitare: aprovação de condomínios */}
          <Route element={<ProtectedRoute allowedRoles={['DEV']} />}>
            <Route path="/painel-dev" element={<PainelDev />} />
          </Route>

          {/* Rota Comum a todos os logados */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO', 'FUNCIONARIO', 'MASTER']} />}>
             <Route path="/perfil" element={<Perfil />} />
             <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
             <Route path="/avisos" element={<MuralAvisos />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </VisualizadorImagemProvider>
    </AuthProvider>
  );
}

export default App;
