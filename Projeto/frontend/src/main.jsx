import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// sistema visual Habitare: depois do CSS das páginas, para valer por cima delas
import './styles/habitare.css'
import { iniciarAppNativo } from './services/appNativo'

// No app Android: login do Google pelo Chrome, botão voltar e barra de status
iniciarAppNativo()

createRoot(document.getElementById('root')).render(
  <App />,
)
