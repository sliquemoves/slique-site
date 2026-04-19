import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const rootEl = document.getElementById('root');
rootEl.style.background = '#000';
rootEl.style.minHeight = '100vh';
ReactDOM.createRoot(rootEl).render(
  <App />
)
