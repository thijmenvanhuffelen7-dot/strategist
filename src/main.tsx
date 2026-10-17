import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { App } from './App'
import { AuthProvider } from './auth/AuthProvider'
import { ThemeProvider } from './lib/theme'
import { supabaseConfigured } from './lib/supabase'
import { SetupScreen } from './components/SetupScreen'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {supabaseConfigured ? (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      ) : (
        <SetupScreen />
      )}
    </ThemeProvider>
  </StrictMode>,
)
