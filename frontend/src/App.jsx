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
import PainelPorteiro from './pages/PainelPorteiro';
import PainelAdmin from './pages/PainelAdmin';
import Perfil from './pages/Perfil';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Navigate to="/login" replace />} />
          <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
          <Route path="/cadastro-admin" element={<CadastroAdmin />} />
          
          {/* Rotas de Morador (SINDICO herda) */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ocorrencia" element={<Ocorrencia />} />
            <Route path="/reclamacao" element={<Reclamacao />} />
            <Route path="/feed" element={<FeedOcorrencias />} />
            <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
          </Route>
          
          {/* Painel de Manutenção/Funcionário */}
          <Route element={<ProtectedRoute allowedRoles={['FUNCIONARIO', 'SINDICO']} />}>
             <Route path="/painel-funcionario" element={<PainelFuncionario />} />
          </Route>
          
          {/* Painel da Portaria */}
          <Route element={<ProtectedRoute allowedRoles={['PORTEIRO']} />}>
             <Route path="/painel-portaria" element={<PainelPorteiro />} />
          </Route>
          
          {/* Painel do Síndico */}
          <Route element={<ProtectedRoute allowedRoles={['SINDICO']} />}>
            <Route path="/painel" element={<PainelSindico />} />
          </Route>
          
          {/* Painel de Governança Global (Admin) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/painel-admin" element={<PainelAdmin />} />
          </Route>
          
          {/* Rota Comum a todos os logados */}
          <Route element={<ProtectedRoute allowedRoles={['MORADOR', 'SINDICO', 'FUNCIONARIO', 'ADMIN', 'PORTEIRO']} />}>
             <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
