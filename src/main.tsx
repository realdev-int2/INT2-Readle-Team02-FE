import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import '@/shared/styles/global.css'

async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_MOCK !== 'true') {
    return
  }

  try {
    const { worker } = await import('@/mocks/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  } catch (error) {
    console.error('[MSW] Mocking initialization failed.', error)
  }
}

async function bootstrap() {
  await enableMocking()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap().catch((error) => {
  console.error('[App] Bootstrap failed.', error)
})
