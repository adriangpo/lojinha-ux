import { offlineSimulado } from './conexao'
import { detalhesDaResposta, monitor } from './monitor'

// Um erro da lista { errors: [...] } que algumas rotas mandam (tema Erros úteis).
export type ErroDeCampo = { code: string; message: string; field: string }

export class ErroDaApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
    // Erros por campo, quando a API manda: [{ code: 'PRODUCT_NAME_TAKEN', message: '...', field: 'nome' }].
    public erros?: ErroDeCampo[],
    // Cabeçalhos da resposta, para ler coisas como o Retry-After de um 429.
    public cabecalhos?: Headers,
  ) {
    super(mensagem)
  }
}

type Opcoes = {
  method?: string
  corpo?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

// Todas as chamadas da lojinha passam por aqui.
// O cabeçalho x-request-id liga a barra do navegador à barra da API no monitor.
export async function api<T>(caminho: string, { method = 'GET', corpo, signal, headers }: Opcoes = {}): Promise<T> {
  const id = crypto.randomUUID()
  const corpoEmTexto = corpo === undefined ? undefined : JSON.stringify(corpo)
  monitor.inicio(id, `${method} ${caminho}`, { requisicao: { cabecalhos: headers, corpo: corpoEmTexto } })

  // "Offline" ligado no monitor: falha igual a um fetch sem rede, sem nem sair do navegador.
  if (offlineSimulado()) {
    monitor.fim(id, 'erro', 'offline')
    throw new TypeError('Failed to fetch')
  }

  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', 'x-request-id': id, ...headers },
      body: corpoEmTexto,
    })
  } catch (erro) {
    monitor.fim(id, signal?.aborted ? 'cancelada' : 'erro')
    throw erro
  }

  // Para o monitor: status, cabeçalhos, corpo e se veio da rede ou do cache.
  const detalhes = await detalhesDaResposta(resposta).catch(() => undefined)
  monitor.fim(id, resposta.ok ? 'ok' : 'erro', String(resposta.status), detalhes)

  const dados = await resposta.json()
  if (!resposta.ok) {
    const mensagem = dados.erro ?? dados.errors?.[0]?.message ?? 'Erro inesperado'
    throw new ErroDaApi(resposta.status, mensagem, dados.errors, resposta.headers)
  }
  return dados as T
}
