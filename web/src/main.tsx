import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
// Antes de tudo: o navigator.onLine e os eventos online/offline já respeitam o "Offline" do monitor.
import './lib/conexao'
import { monitor } from './lib/monitor'

const queryClient = new QueryClient()

// Só para o monitor: quando uma tela pede um dado que o TanStack Query já tem, ele aparece na hora.
queryClient.getQueryCache().subscribe((evento) => {
  if (evento.type === 'observerAdded' && evento.query.state.data !== undefined) {
    monitor.cache(`do cache do TanStack: ${evento.query.queryKey.join(' / ')}`)
  }
})

// O padrão do SegmentedControl marca a opção escolhida com branco sobre cinza: no projetor some.
const tema = createTheme({
  components: {
    SegmentedControl: { defaultProps: { color: 'blue' } },
  },
})

// Sem <StrictMode> de propósito: em desenvolvimento ele roda cada efeito duas vezes,
// e o monitor mostraria requisições duplicadas que não existem em produção.
createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={tema}>
    {/* Onde os toasts aparecem (tema Feedback de sucesso). */}
    <Notifications position="bottom-center" />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>,
)
