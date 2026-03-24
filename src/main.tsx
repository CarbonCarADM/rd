import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Dashboard from './Dashboard'
import './index.css'

// Roteamento simples por pathname
const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {path === '/dashboard' ? <Dashboard /> : <App />}
  </React.StrictMode>
)