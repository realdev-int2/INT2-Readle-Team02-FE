import { BrowserRouter } from 'react-router'
import { AppRouter } from '@/app/router/AppRouter'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  )
}

export default App
