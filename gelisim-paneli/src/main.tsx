import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { EvaluationProvider } from './contexts/EvaluationContext'
import { ToastProvider } from './contexts/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <EvaluationProvider>
          <App />
        </EvaluationProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
