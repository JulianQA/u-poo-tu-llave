import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MiLlaveProvider } from './components/mi-llave-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MiLlaveProvider>
      <App />
    </MiLlaveProvider>
  </StrictMode>,
)
