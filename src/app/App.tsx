import { BrowserRouter } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AppRouter } from '@/app/router/AppRouter'

function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </QueryProvider>
  )
}

export default App
