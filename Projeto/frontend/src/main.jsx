import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// sistema visual Habitare: depois do CSS das páginas, para valer por cima delas
import './styles/habitare.css'

createRoot(document.getElementById('root')).render(
  <App />,
)
