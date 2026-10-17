import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { App } from './App'
import { ThemeProvider } from './lib/theme'
import { requestPersistentStorage } from './lib/db'
import { ConfirmProvider } from './components/ConfirmDialog'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: false } },
})

requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
