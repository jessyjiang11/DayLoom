import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import { SyncProvider } from './features/sync/SyncProvider'
import { router } from './app/router'
import { queryClient } from './lib/queryClient'
import './App.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SyncProvider>
          <RouterProvider router={router} />
        </SyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
