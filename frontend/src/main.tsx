import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { Toaster } from './components/ui/sonner' // Removed from here
import './index.css' // This import should work now
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Toaster is now only in Layout.tsx */}
    {/* <Toaster position="top-right" richColors /> */}
  </StrictMode>,
) 