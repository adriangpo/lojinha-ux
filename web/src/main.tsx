import '@mantine/core/styles.css'
import { createTheme, MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>,
)
