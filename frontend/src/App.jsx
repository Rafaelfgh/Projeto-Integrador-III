import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cadastro from './pages/Cadastro';
import CadastroAdmin from './pages/CadastroAdmin';
import GerenciamentoUsuarios from './pages/GerenciamentoUsuarios';
import Ocorrencia from './pages/Ocorrencia';
import Reclamacao from './pages/Reclamacao';
import FeedOcorrencias from './pages/FeedOcorrencias';
import MinhasSolicitacoes from './pages/MinhasSolicitacoes';
import PainelSindico from './pages/PainelSindico';
import Perfil from './pages/Perfil';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-admin" element={<CadastroAdmin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gerenciamento-usuarios" element={<GerenciamentoUsuarios />} />
        <Route path="/ocorrencia" element={<Ocorrencia />} />
        <Route path="/reclamacao" element={<Reclamacao />} />
        <Route path="/feed" element={<FeedOcorrencias />} />
        <Route path="/solicitacoes" element={<MinhasSolicitacoes />} />
        <Route path="/painel" element={<PainelSindico />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
