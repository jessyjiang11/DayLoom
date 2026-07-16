import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthProvider'
import { router } from './app/router'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
