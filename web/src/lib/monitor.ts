// Infraestrutura do monitor: avisa a aba /monitor do que acontece no navegador.
// Usa BroadcastChannel, que conversa entre abas da mesma origem.

export type Faixa = 'usuario' | 'tela' | 'navegador' | 'api' | 'banco'
export type Resultado = 'ok' | 'erro' | 'cancelada'

// "espera": tempo parado de propósito (backoff, Retry-After). "cache": respondido sem ir à rede.
export type Estilo = 'espera' | 'cache'

// O que o inspetor mostra quando se clica numa barra.
export type Detalhes = {
  status?: number
  cabecalhos?: Record<string, string>
  corpo?: string
  // Bytes que passaram pela rede (0 quando saiu do cache do navegador).
  bytes?: number
  origem?: 'rede' | 'cache' | '304'
}

// Mesmo formato dos eventos da API (api/src/monitor.ts), mais os que só o navegador gera.
export type EventoMonitor =
  | { tipo: 'inicio'; id: string; pai?: string; faixa: Faixa; rotulo: string; em: number; estilo?: Estilo; requisicao?: Detalhes }
  | { tipo: 'fim'; id: string; resultado: Resultado; detalhe?: string; em: number; resposta?: Detalhes }
  // Ação instantânea: uma tecla, um clique, algo que apareceu na tela.
  | { tipo: 'marca'; id: string; faixa: Faixa; rotulo: string; em: number; estilo?: Estilo }
  // Quanto de um trecho em andamento já foi feito (0 a 1). Ex.: bytes enviados de um upload.
  | { tipo: 'progresso'; id: string; fracao: number; em: number }
  // Mensagem que ninguém pediu na hora: o servidor empurrando (NOTIFY, SSE).
  // `trecho` é a conexão por onde ela passou, para desenhar um tique na barra.
  | { tipo: 'aviso'; id: string; de: Faixa; para: Faixa; rotulo: string; em: number; trecho?: string }

const NOME_DO_CANAL = 'monitor'
const canal = new BroadcastChannel(NOME_DO_CANAL)
const enviar = (evento: EventoMonitor) => canal.postMessage(evento)
const novoId = () => crypto.randomUUID()

export const monitor = {
  inicio(id: string, rotulo: string, opcoes: { estilo?: Estilo; requisicao?: Detalhes; em?: number } = {}) {
    const { em = Date.now(), ...resto } = opcoes
    enviar({ tipo: 'inicio', id, faixa: 'navegador', rotulo, em, ...resto })
  },
  fim(id: string, resultado: Resultado, detalhe?: string, resposta?: Detalhes, em = Date.now()) {
    enviar({ tipo: 'fim', id, resultado, detalhe, resposta, em })
  },
  // O usuário fez algo.
  marca(rotulo: string) {
    enviar({ tipo: 'marca', id: novoId(), faixa: 'usuario', rotulo, em: Date.now() })
  },
  // A tela mudou: é o que o usuário está vendo agora.
  tela(rotulo: string) {
    enviar({ tipo: 'marca', id: novoId(), faixa: 'tela', rotulo, em: Date.now() })
  },
  // O dado veio de um cache, sem requisição.
  cache(rotulo: string) {
    enviar({ tipo: 'marca', id: novoId(), faixa: 'navegador', rotulo, em: Date.now(), estilo: 'cache' })
  },
  progresso(id: string, fracao: number) {
    enviar({ tipo: 'progresso', id, fracao, em: Date.now() })
  },
  aviso(rotulo: string, de: Faixa, para: Faixa, trecho?: string) {
    enviar({ tipo: 'aviso', id: novoId(), de, para, rotulo, em: Date.now(), trecho })
  },
  // Uma espera de propósito, desenhada como barra tracejada. Devolve a Promise da espera.
  esperar(rotulo: string, ms: number) {
    const id = novoId()
    enviar({ tipo: 'inicio', id, faixa: 'navegador', rotulo, em: Date.now(), estilo: 'espera' })
    return new Promise<void>((resolver) =>
      setTimeout(() => {
        enviar({ tipo: 'fim', id, resultado: 'ok', em: Date.now() })
        resolver()
      }, ms),
    )
  },
}

export function ouvirNavegador(aoReceber: (evento: EventoMonitor) => void) {
  const ouvinte = new BroadcastChannel(NOME_DO_CANAL)
  ouvinte.onmessage = (mensagem) => aoReceber(mensagem.data)
  return () => ouvinte.close()
}

// ── O que o navegador faz sozinho, sem passar pelo lib/api.ts ──

// Imagens (<img>) e saltos de layout. Chamado uma vez, pela lojinha (não pelo monitor).
export function observarNavegador() {
  const recursos = new PerformanceObserver((lista) => {
    for (const entrada of lista.getEntries() as PerformanceResourceTiming[]) {
      if (entrada.initiatorType !== 'img') continue
      const id = novoId()
      const doCache = entrada.transferSize === 0 && entrada.decodedBodySize > 0
      // A entrada chega quando a imagem termina; os horários vêm relativos ao carregamento da página.
      const inicio = performance.timeOrigin + entrada.startTime
      const fim = performance.timeOrigin + entrada.responseEnd
      monitor.inicio(id, `GET ${new URL(entrada.name).pathname}`, {
        em: inicio,
        estilo: doCache ? 'cache' : undefined,
      })
      monitor.fim(id, 'ok', doCache ? 'cache do navegador' : undefined, { bytes: entrada.transferSize }, fim)
    }
  })
  recursos.observe({ type: 'resource' })

  // Layout shift: quanto a página "pulou". O CLS do Google soma esses valores.
  const saltos = new PerformanceObserver((lista) => {
    for (const entrada of lista.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
      // Ignora saltos causados por um clique (esperados) e os imperceptíveis (menos de 1% da tela).
      if (entrada.hadRecentInput || entrada.value < 0.01) continue
      monitor.tela(`layout pulou (${entrada.value.toFixed(3)})`)
    }
  })
  saltos.observe({ type: 'layout-shift' })

  return () => {
    recursos.disconnect()
    saltos.disconnect()
  }
}

// Lê o que vale mostrar no inspetor, sem consumir a resposta original.
export async function detalhesDaResposta(resposta: Response): Promise<Detalhes> {
  const corpo = await resposta.clone().text()
  // A medição de rede da requisição só fica disponível um instante depois do corpo.
  await new Promise((resolver) => setTimeout(resolver, 0))
  const medicao = (performance.getEntriesByName(resposta.url) as PerformanceResourceTiming[]).at(-1)

  // O fetch mostra 200 mesmo quando o navegador usou o cache; a medição de rede conta a verdade:
  // nada trafegou = cache; trafegaram só os cabeçalhos (menos que o corpo) = 304.
  let origem: Detalhes['origem'] = 'rede'
  if (medicao && medicao.transferSize === 0 && medicao.encodedBodySize > 0) origem = 'cache'
  else if (medicao && medicao.transferSize > 0 && medicao.transferSize < medicao.encodedBodySize) origem = '304'

  return {
    status: resposta.status,
    cabecalhos: Object.fromEntries(resposta.headers),
    corpo: corpo.slice(0, 2000),
    bytes: medicao?.transferSize,
    origem,
  }
}
