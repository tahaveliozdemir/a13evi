import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { EvaluationProvider } from './contexts/EvaluationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <EvaluationProvider>
        <App />
      </EvaluationProvider>
    </AuthProvider>
  </StrictMode>,
)
